import platform
import logging as log


class Profile:
    log.basicConfig(
        level=log.INFO,
        format='[%(asctime)s %(levelname)-8s %(module)-18s %(funcName)-10s %(lineno)4s]: %(message)s'
    )
    # detection of platform
    pf = platform.system()
    # for sync
    is_running = True
    # for connection
    user_name = ""
    port = ""
    ip_address = ""
    # for controlling each mode
    is_pilot_experiment = False
    is_experiment = False
    is_screen = False
    """ 
    <<if pilot-experiment is enabled...>>
        map_selected = {
            "is_pilot_experiment": true,
            "is_experiment": false,
            "is_screen": false,
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
            "is_pilot_experiment": false,
            "is_experiment": true
            "is_screen": false,
            "order": order,
            "0": {
                "valence": 
                "arousal": 
            },
            "1": { ...
        }
    """
    # path setting (for cascade and cnn model)
    path_cascade = ""
    log_dir = ""
    if pf == "Windows":
        log.info("Windows has been detected..")
        path_cascade = "..\\..\\etc\\cascades\\haarcascade_frontalface_default.xml"
        log_dir = "..\\..\\etc\\facial_affective_model\\Fri_03_Jul_2020_09_38_10\\facial_affective_va_comp.hdf5"
    elif pf == "Darwin" or pf == "Linux":
        log.info(pf + " has been detected..")
        path_cascade = "../../etc/cascades/haarcascade_frontalface_default.xml"
        log_dir = "../../etc/facial_affective_model/Fri_03_Jul_2020_09_38_10/facial_affective_va_comp.hdf5"

    # for sharing value
    map_selected = {}
