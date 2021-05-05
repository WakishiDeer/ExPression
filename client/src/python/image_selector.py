from profile import Profile
import logging as log
import pprint
import cv2
import pandas as pd
import math
import random
from matplotlib import pyplot as plt


class ImageSelector:
    def __init__(self):
        log.basicConfig(
            level=log.INFO,
            format='[%(asctime)s %(levelname)-8s %(module)-18s %(funcName)-10s %(lineno)4s]: %(message)s'
        )
        # for selector
        # when existing database on removable storage
        # self.db_path = "/Volumes/TOSHIBA EXT/AffectNet_Database/"
        # when existing database on this machine
        self.db_path = "../../etc/"
        self.db_path_img = self.db_path + \
            "Manually_Annotated_compressed/Manually_Annotated_Images/"
        self.df = None

        """ 
        NOTE:   when using "json.dump," value will be automatically formated for JavaScript
                e.g., True(fits to Python) -> json.dump -> true(fits to JavaScript)
        <<if pilot-experiment is enabled...>>
        map_selected = {
            "randomedOrder": randomed_order,
            "0": {
                "df": df,
                "theta": theta,
                "radius": radius,
                "count": number_of_df_rows,
                "filePath": file_path_for_image,
                "valence": valence_of_each_image,
                "arousal": arousal_of_each_image
            },
            "1": { ...
        }

        <<if experiment is enabled...>>
        map_selected = {
            "order": order,
            "0": {
                "valence": 
                "arousal": 
            },
            "1": { ...
        }
        """
        self.map_selected = {}
        self.error = 0.05
        # for viewer
        self.randomed_order = []
        self.map_randomed_img = {}
        self.row = None
        # etc
        self.count = 0

    def read_csv(self):
        self.df = pd.read_csv(
            self.db_path + "Manually_Annotated_file_lists/training.csv")
        # exclude unnecessary cols (i.e., exclude unused values)
        self.df = self.df[self.df.valence != -2]

    def image_selecting(self):
        va_list = [[0, 0, 0, 0]]
        for theta in range(0, 360, 45):
            va_list.append([round(math.cos(math.radians(theta)) / 2, 3),
                            round(math.sin(math.radians(theta)) / 2, 3), theta, 0.5])
            va_list.append([round(math.cos(math.radians(theta)), 3),
                            round(math.sin(math.radians(theta)), 3), theta, 1])
        pprint.pprint(va_list)

        for i, va in enumerate(va_list):
            # va[0] will be "valence" of each coordinates
            # va[1] will be "arousal" of each coordinates
            # va[2] will be "theta" of each coordinates
            # va[3] will be "radius" of each coordinates
            self.map_selected[str(i)] = {}
            self.map_selected[str(i)]["df"] = self.df[
                ((va[0] - self.error < self.df['valence']) & (self.df['valence'] < va[0] + self.error)) &
                ((va[1] - self.error < self.df['arousal']) &
                 (self.df['arousal'] < va[1] + self.error))
            ][["valence", "arousal", "subDirectory_filePath"]]
            self.map_selected[str(i)]["theta"] = va[2]
            self.map_selected[str(i)]["radius"] = va[3]
            self.count += 1

    def set_image(self):
        # e.g., when setting n = 4, each value of self.randomed_order is unique and "{2, 4, 1, 3}"
        self.randomed_order = random.sample(
            list(range(0, self.count)), k=self.count)
        # add infomation to selected_map which will be send to server
        if Profile.is_pilot_experiment:
            self.map_selected["randomedOrder"] = self.randomed_order
            # add info to map_selected
            for i, ro in enumerate(self.randomed_order):
                # sample row from candidates which are selected with using range-filter
                self.row = self.map_selected[str(ro)]["df"].sample()
                self.map_selected[str(ro)]["filePath"] = self.db_path_img + \
                    str(self.row["subDirectory_filePath"].values[0])
                self.map_selected[str(ro)]["valence"] = float(
                    self.row["valence"].values[0])
                self.map_selected[str(ro)]["arousal"] = float(
                    self.row["arousal"].values[0])
                del self.map_selected[str(ro)]["df"]    # delete unused value
                # read image
                self.map_randomed_img[str(ro)] = cv2.imread(
                    self.map_selected[str(ro)]["filePath"])
                self.map_randomed_img[str(ro)] = cv2.resize(
                    self.map_randomed_img[str(ro)], (500, 500))
            # merge global variable with instance variable
            Profile.map_selected.update(self.map_selected)
            pprint.pprint(Profile.map_selected)

    def save_image(self):
        for key in self.map_randomed_img:
            print("key: ", key)
            print("valence: ", self.map_selected[key]["valence"])
            print("arousal: ", self.map_selected[key]["arousal"])
            cv2.imwrite("../node_js/images/" + str(key) +
                        ".jpg", self.map_randomed_img[key])

    def show_image(self):
        current_number = 0
        cv2.imshow("image" + str(1) + "/17", self.randomed_img[current_number])
        """ for running on with terminal """
        # start previewer
        while(True):
            key = cv2.waitKey(0)
            if key == 97 and current_number != 0:
                cv2.destroyWindow("image" + str(current_number+1) + "/17")
                current_number -= 1
                cv2.imshow("image" + str(current_number+1) + "/17",
                           self.randomed_img[current_number])
            elif key == 100 and current_number != self.count - 1:
                cv2.destroyWindow("image" + str(current_number+1) + "/17")
                current_number += 1
                cv2.imshow("image" + str(current_number+1) + "/17",
                           self.randomed_img[current_number])
            elif key == 27:
                cv2.destroyAllWindows()
                break
            print(current_number+1, '/17 (v, a) = (',
                  self.row["valence"].values[0], ", ", self.row["arousal"].values[0], ")")
        """ for running on with jupyter-notebook """
        # plt.imshow(cv2.cvtColor(self.randomed_img[i], cv2.COLOR_BGR2RGB))
        # plt.show()
        # print(self.db_path_img + row["subDirectory_filePath"].values[0]


if __name__ == "__main__":
    selector = ImageSelector()
    selector.read_csv()
    selector.image_selecting()
    selector.set_image()
    selector.show_image()
