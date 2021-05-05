from image_selector import ImageSelector
from va_selector import VASelector
from screen_capture import Capture
from profile import Profile
import argparse
import time
import sys
import json
import atexit
import platform
import zmq
import cv2
import numpy as np
from tensorflow.keras import models
from tensorflow.keras import backend as K
import pprint
import logging as log


class Publisher:
    def __init__(self):
        log.basicConfig(
            level=log.INFO,
            format='[%(asctime)s %(levelname)-8s %(module)-18s %(funcName)-10s %(lineno)4s]: %(message)s'
        )
        pf = platform.system()
        # command line argument
        self.parser = argparse.ArgumentParser(
            description="Run Emotion Visualization as client")
        self.parser.add_argument(
            'user_name', help="user's name (must be unique)")
        self.parser.add_argument(
            'ip_address', help="ip address of the server (works as a proxy)")
        self.parser.add_argument(
            'port_number', help="port number of the server")
        self.parser.add_argument(
            '--pilot_experiment', default=False, action='store_true', help="run as pilot-experiment mode")
        self.parser.add_argument(
            '--experiment', default=False, action='store_true', help="run as experiment mode")
        self.parser.add_argument(
            '--screen', default=False, action='store_true',
            help="run as screen-selector mode, which can detect face on a display"
        )
        self.args = self.parser.parse_args()
        Profile.user_name = self.args.user_name
        Profile.ip_address = self.args.ip_address
        Profile.port = self.args.port_number
        Profile.is_pilot_experiment = self.args.pilot_experiment
        Profile.is_experiment = self.args.experiment
        Profile.is_screen = self.args.screen
        # to notify JavaScript that experimental mode is enabled or disabled
        Profile.map_selected["is_pilot_experiment"] = self.args.pilot_experiment
        Profile.map_selected["is_experiment"] = self.args.experiment
        Profile.map_selected["is_screen"] = self.args.screen
        if pf == "Windows" and (Profile.is_pilot_experiment or Profile.is_experiment or Profile.is_screen):
            log.error(
                "Experimental Mode with Windows is currently unavailable")
            sys.exit()
        elif Profile.is_pilot_experiment:
            log.info("pilot experiment mode: " +
                     str(Profile.is_pilot_experiment))
            self.image_selector = ImageSelector()
        elif Profile.is_experiment:
            log.info("experiment mode: " + str(Profile.is_experiment))
            self.va_selector = VASelector()
        elif Profile.is_screen:             # screen-mode setting
            log.info("screen mode: " + str(Profile.is_screen))
            self.capture = Capture()  # make instance for capturing

        # process for ZeroMQ
        atexit.register(self.clean_up)
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.PUB)
        self.socket.connect("tcp://" + Profile.ip_address + ":" + Profile.port)
        self.json_dict = {}
        # variable for predicted Valence-arousal
        self.num_temp = 15
        self.temp_valence = []
        self.temp_arousal = []
        # cascade and filter for clipping face
        self.face_cascade = cv2.CascadeClassifier(Profile.path_cascade)
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(5, 5))
        # set format for logging
        self.model = models.load_model(Profile.log_dir,
                                       custom_objects={'root_mean_squared_error': self.root_mean_squared_error,
                                                       'mean_squared_error_modified': self.mean_squared_error_modified})

    def start_therad(self):
        log.info("Starting..")
        # if experiment mode is enabled
        if Profile.is_pilot_experiment:
            self.select_image()
        elif Profile.is_experiment:
            self.select_va()
        elif Profile.is_screen:
            self.load_model()
            self.predict_screen()
        else:
            self.load_model()
            self.predict_webcam()

    def load_model(self):
        self.model = models.load_model(Profile.log_dir,
                                       custom_objects={'root_mean_squared_error': self.root_mean_squared_error,
                                                       'mean_squared_error_modified': self.mean_squared_error_modified})

    def select_image(self):
        self.image_selector.read_csv()
        self.image_selector.image_selecting()
        self.image_selector.set_image()
        self.image_selector.save_image()
        while True:
            self.socket.send_string(self.make_json_string(True))
            time.sleep(1.0)

    def select_va(self):
        self.va_selector.select()
        while True:
            self.socket.send_string(self.make_json_string(True))
            time.sleep(1.0)

    # predict from web-cam
    def predict_webcam(self):
        # try to access your primary capture device
        cap = cv2.VideoCapture(0)
        ret = cap.isOpened()
        if not ret:
            log.error(
                "Failed to access to your web-cam, so check your device is connected")
            import sys
            sys.exit()
        while True:
            ret, frame = cap.read()
            if not ret:
                log.error("Can't be read frame")
            # input_size of the model based on AffectNet is: 3 x 96 x 96
            faces = self.face_cascade.detectMultiScale(
                frame, minSize=(96, 96))
            # limit number of users for consistence
            if len(faces) == 1:
                x, y, w, h = faces[0]
                input_img = frame[y:y + h, x:x + w]
                self.predict_from_model(self, input_img)
                self.send_to_proxy(is_proceeding=True)
        cap.release()

    # predict from screen
    def predict_screen(self):
        while True:
            self.capture.get_face_image()
            # if none of face was detected, keep waiting
            if len(self.capture.face_img_map) == 0:
                continue
            # process for each facial image
            for i, img_key in enumerate(self.capture.face_img_map):
                self.predict_from_model_multi(
                    self.capture.face_img_map[img_key]["face_img"], target=str(img_key))
                # name will be: '0', '1', '2'.. which are uniquely assigned
                self.send_to_proxy(is_proceeding=True, target=str(img_key))
            # list map(s) up for deleting
            self.capture.update_map()
            # delete unnecessary value of map, sending signal of terminating
            for dfn in self.capture.delete_face_number_list:
                # to notify sever of finishing (then, sever will delete map of clients)
                self.send_to_proxy(is_proceeding=False,
                                   target="face_" + str(dfn))
            self.capture.delete_map()

    def predict_from_model(self, input_img):
        input_img = np.array(
            [cv2.resize(input_img, (96, 96))/255])  # fit to required size
        va = self.model.predict(input_img).squeeze()    # predict and format
        self.temp_valence.append(va[0])
        self.temp_arousal.append(va[1])
        # store calculated values
        if len(self.temp_valence) == self.num_temp + 1:
            self.temp_valence.pop(0)
            self.temp_arousal.pop(0)

    def predict_from_model_multi(self, input_img, target=None):
        input_img = np.array(
            [cv2.resize(input_img, (96, 96)) / 255])  # fit to required size
        va = self.model.predict(input_img).squeeze()  # predict and format
        self.capture.face_img_map[target]["temp_valence"].append(va[0])
        self.capture.face_img_map[target]["temp_arousal"].append(va[1])
        # store calculated values
        if len(self.capture.face_img_map[target]["temp_valence"]) == self.num_temp + 1:
            self.capture.face_img_map[target]["temp_valence"].pop(0)
            self.capture.face_img_map[target]["temp_arousal"].pop(0)

    def send_to_proxy(self, is_proceeding=True, target=None):
        # send value of json to server (which works as a proxy)
        self.socket.send_string(
            self.make_json_string(is_proceeding, target=target))

    # format JSON for each correct one
    def make_json_string(self, is_proceeding=True, target=None):
        if Profile.is_pilot_experiment:
            self.json_dict = Profile.map_selected
        # input source is random value (from VA Space)
        elif Profile.is_experiment:
            self.json_dict = Profile.map_selected
        elif Profile.is_screen:  # input source is screen
            # send multi information from ONE device (screen-mode)
            # name should be unique one
            valence = float("{0:.4f}".format(
                np.array(self.capture.face_img_map[target]["temp_valence"]).mean()))
            arousal = float("{0:.4f}".format(
                np.array(self.capture.face_img_map[target]["temp_arousal"]).mean()))
            self.json_dict = {
                "name": target,
                "valence": valence,
                "arousal": arousal,
                "running": str(is_proceeding)
            }
            self.capture.face_img_map[target]["json_dict"] = self.json_dict
        else:   # default (input source is web-cam)
            valence = float("{0:.4f}".format(
                np.array(self.temp_valence).mean()))
            arousal = float("{0:.4f}".format(
                np.array(self.temp_arousal).mean()))
            self.json_dict = {
                "name": Profile.user_name,
                "valence": valence,
                "arousal": arousal,
                "running": str(is_proceeding)
            }
        return json.dumps(self.json_dict)

    def clean_up(self):
        print("\n\n TERMINATING.. \n\n")
        # notify server that connection will be closed
        self.send_to_proxy(is_proceeding=False)
        self.socket.close()
        self.context.destroy()
        sys.exit()

    def mean_squared_error_modified(self, y_true, y_pred):
        alpha = 0.1  # alpha is regarded as hyper parameter
        punishment = alpha * \
            K.mean(K.square((K.sign(y_true) - K.sign(y_pred))))
        return K.mean(K.square(y_true - y_pred)) + punishment

    def root_mean_squared_error(self, y_true, y_pred):
        return K.sqrt(K.mean(K.square(y_pred - y_true)))

    def pearson_correlation_coefficient(self, y_true, y_pred):
        x = y_true
        y = y_pred
        mx = K.mean(x, axis=0)
        my = K.mean(y, axis=0)
        xm, ym = x - mx, y - my
        r_num = K.sum(xm * ym)
        x_square_sum = K.sum(xm * xm)
        y_square_sum = K.sum(ym * ym)
        r_den = K.sqrt(x_square_sum * y_square_sum)
        r = r_num / r_den
        return K.mean(r)

    def concordance_correlation_coefficient(self, y_true, y_pred):
        x = y_true
        y = y_pred
        mx = K.mean(x, axis=0)
        my = K.mean(y, axis=0)
        xm, ym = x - mx, y - my
        r_num = K.sum(xm * ym)
        x_square_sum = K.sum(xm * xm)
        y_square_sum = K.sum(ym * ym)
        r_den = K.sqrt(x_square_sum * y_square_sum)
        r = r_num / r_den
        cc = K.mean(r)
        # for CCC
        ccc = (2*cc*r_den) / (x_square_sum+y_square_sum + K.square(my - mx))
        return ccc

    def sign_agreement_metric(self, y_true, y_pred):
        return K.mean(K.sign(y_true) * K.sign(y_pred))
