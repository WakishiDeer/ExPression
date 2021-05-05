from mss import mss
import numpy as np
import cv2
import time


class Capture:
    # constructor
    def __init__(self):
        self.fps = 30  # define fps for capturing
        self.screen_shot = None
        self.monitor = None
        self.face_img_map = {}
        """ face_img_map = {
            "face_0": {
                "face_img": facial_image,
                "temp_valence": [temp_valence],
                "temp_arousal": [temp_arousal],
                "json_dict": json_for_sending,
            },
            "face_1": {
                "face_img": facial_image,
                "temp_valence": [temp_valence],
                "temp_arousal": [temp_arousal],
                "json_dict": json_for_sending,
            }, ...
        """
        self.face_number = 0
        self.delete_face_number_list = []
        # save for memory conservation
        with mss() as screen_shot:
            self.screen_shot = screen_shot
            self.monitor = screen_shot.monitors[1]
        # for Cascade-classifier
        self.path_cascade = "../../etc/cascades/haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(self.path_cascade)

    # return image as array
    # image can be shown by using "cv2.imshow" directly
    def capture(self):
        img = np.array(self.screen_shot.grab(self.monitor))
        return img[:, :, :3]

    # to reduce memory comsumpution and keep overall view
    def resize_image(self, raw_img):
        height = raw_img.shape[0]
        width = raw_img.shape[1]
        # input_size of the model based on AffectNet is: 3 x 96 x 96
        return cv2.resize(raw_img, (96, 96))

    # clip faces, using Haar-like feature
    def detect_face(self, raw_img):
        # minSize written below is set (256, 256) to improve accuracy of detection
        faces = self.face_cascade.detectMultiScale(raw_img, minSize=(120, 120))
        # if faces are not detected, return
        self.face_number = len(faces)
        if self.face_number == 0:
            return
        # process for each face
        for i, face in enumerate(faces):
            # make map for each face
            if not "face_" + str(i) in self.face_img_map:
                self.face_img_map["face_" + str(i)] = {
                    "temp_valence": [],
                    "temp_arousal": [],
                    "json_dict": {},
                }
            x, y, w, h = face
            self.face_img_map["face_" +
                              str(i)]["face_img"] = raw_img[y: y + h, x: x + w]

    def update_map(self):
        # list map(s) up for deleting
        img_map_number = len(self.face_img_map)
        delete_face_number_list = []
        for i in range(img_map_number - self.face_number):
            target_number = self.face_number + i
            delete_face_number_list.append(target_number)
        self.delete_face_number_list = delete_face_number_list

    def delete_map(self):
        # delete unused set of map(s)
        for dfn in self.delete_face_number_list:
            del self.face_img_map["face_" + str(dfn)]

    def get_face_image(self):
        raw_img = self.capture()
        self.detect_face(raw_img)
        # time.sleep(1 / self.fps)

    def show_as_video(self):
        while True:
            # common process: get image, delete image,
            # resize image, and detect image
            # get image and show it
            raw_img = self.capture()
            # detect faces
            self.detect_face(raw_img)
            # process for each faces
            for i, img_key in enumerate(self.face_img_map):
                img = self.resize_image(self.face_img_map[img_key]["face_img"])
                #  if you want to preview each face image, activate
                cv2.imshow("preview_" + str(i), img)

            # show overview image
            print(self.face_img_map)
            # if ESC is pressed, break and destroy window
            if cv2.waitKey(1) == 27:
                break
            # wait in order to avoid wasting computational power
            time.sleep(1 / self.fps)
        cv2.destroyAllWindows()


if __name__ == '__main__':
    capture = Capture()
    capture.show_as_video()
