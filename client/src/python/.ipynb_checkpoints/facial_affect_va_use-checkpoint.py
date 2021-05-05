import numpy as np
from tensorflow.keras import models
from tensorflow.keras import backend as K
import cv2
import queue


def main(model):
    cap = cv2.VideoCapture(0)
    # when the cam cannot be opened, exit
    ret = cap.isOpened()
    if not ret:
        exception("Failed to access to your web-cam, try to check your device is connected")
    # cap.set(cv2.CAP_PROP_FPS, 30)
    # read cascade
    face_cascade = cv2.CascadeClassifier('./cascades/haarcascade_frontalface_default.xml')

    # when you need to hold status, you should add this type of set
    state = set([])

    # capture frame by frame
    # default fps can be shown by using "cap.get(cv2.CAP_PROP_FPS)"
    # to set fps on demand, you need to use "cap.get(cv2.CAP_PROP_FPS, X)" (X means your needed value of fps)
    num_temp = 30
    temp_valence = []
    temp_arousal = []
    while True:
        ret, frame = cap.read()
        if not ret:
            exception("Cannnot be read frame")
        # convert BGR to GRAY in order to process
        # you should separate BGR
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # histgram nomalization (latter is adaptive)
        """
        gray = cv2.equalizeHist(gray)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        """
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(5, 5))
        gray = clahe.apply(gray)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)

        # detect faces
        # one of the face is including below
        # 0 int x
        # 1 int y
        # 2 int width
        # 3 int height
        faces = face_cascade.detectMultiScale(gray, minSize=(96, 96))   # the affect model's input_size = 3 x 96 x 96
        if len(faces) > 0:
            for rect in faces:
                cv2.rectangle(frame, tuple(rect[0:2]), tuple(rect[0:2] + rect[2:4]), (255, 255, 255), thickness=2)
            if len(faces) == 1:
                x, y, w, h = faces[0]
                test_x = frame[y:y + h, x:x + w]
                test_x = np.array([cv2.resize(test_x, (96, 96))/255])
                va = model.predict(test_x).squeeze()
                temp_valence.append(va[0])
                temp_arousal.append(va[1])
                if len(temp_valence) == num_temp + 1:
                    temp_valence.pop(0)
                    temp_arousal.pop(0)
                print(np.array(temp_valence).mean(), " ", np.array(temp_arousal).mean())


        # show results
        cv2.imshow("result", frame)
        key = cv2.waitKey(1)
        if key == 27:
            break

    cv2.destroyAllWindows()
    cap.release()


def exception(str):
    import sys
    print("Exception: " + str)
    sys.exit()


def root_mean_squared_error(y_true, y_pred):
    return K.sqrt(K.mean(K.square(y_pred - y_true)))


def mean_squared_error_modified(y_true, y_pred):
    alpha = 0.1  # alpha is regarded as hyper parameter
    punishment = alpha * K.mean(K.square((K.sign(y_true) - K.sign(y_pred))))
    return K.mean(K.square(y_true - y_pred)) + punishment


if __name__ == '__main__':
    log_dir = "/Users/vimacs/PycharmProjects/fave/src/python/facial_affective_model/Fri_03_Jul_2020_09_38_10"
    model = models.load_model(log_dir + "/facial_affective_va_comp.hdf5",
                              custom_objects={'root_mean_squared_error': root_mean_squared_error,
                                              'mean_squared_error_modified': mean_squared_error_modified})
    va = [0, 0]
    main(model)

