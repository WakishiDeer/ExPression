from profile import Profile
import numpy as np
import logging as log
from matplotlib import pyplot as plt
import pprint


class VASelector:
    def __init__(self):
        log.basicConfig(
            level=log.INFO,
            format='[%(asctime)s %(levelname)-8s %(module)-18s %(funcName)-10s %(lineno)4s]: %(message)s'
        )
        self.map_selected = {}

    def select(self):
        # number of samples which is assessed by each subject
        N = 17
        radius = np.sqrt(np.random.uniform(0, 1, N))
        theta = np.random.uniform(0, 2 * np.pi, N)
        valence = radius * np.cos(theta)
        arousal = radius * np.sin(theta)
        for i, (v, a) in enumerate(zip(valence, arousal)):
            self.map_selected[str(i)] = {}
            self.map_selected[str(i)]["valence"] = valence[i]
            self.map_selected[str(i)]["arousal"] = arousal[i]
        self.map_selected["order"] = [str(i) for i in range(N)]
        pprint.pprint(self.map_selected)
        Profile.map_selected.update(self.map_selected)


if __name__ == "__main__":
    va_selector = VASelector()
    va_selector.va_selecting()
