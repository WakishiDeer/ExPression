from profile import Profile
import subprocess
import platform
import logging as log


class GraphicsOpen:
    """ start node_js server which is used
        to handle estimated valence-arousal value as subscriber """

    def __init__(self):
        log.basicConfig(
            level=log.INFO,
            format='[%(asctime)s %(levelname)-8s %(module)-18s %(funcName)-10s %(lineno)4s]: %(message)s'
        )
        self.isWindows = False
        self.file = "index.html"  # HTML file you want to open
        if Profile.is_experiment:
            self.file = "index_experiment.html"
        self.command_run_node = ""
        self.command_run_p5 = ""
        self.command_profile = " " + Profile.ip_address + \
            " " + str(int(Profile.port) + 1)
        pf = platform.system()
        if pf == "Windows":
            self.isWindows = True
            self.command_run_node = "node ..\\node_js\\node_subscriber.js" + self.command_profile
            self.command_run_p5 = "start ..\\node_js\\" + self.file
        elif pf == "Darwin":
            self.command_run_node = "node ../node_js/node_subscriber.js" + self.command_profile
            self.command_run_p5 = "open ../node_js/" + self.file
        elif pf == "Linux":
            self.command_run_node = "node ../node_js/node_subscriber.js" + self.command_profile
            self.command_run_p5 = "xdg-open ../node_js/" + self.file
        self.process_node = None
        self.process_p5 = None

    def start_thread(self):
        log.info("Starting..")
        self.start_processes()

    def start_processes(self):
        try:
            self.process_node = subprocess.Popen(
                self.command_run_node.split(), shell=self.isWindows)
            self.process_p5 = subprocess.Popen(
                self.command_run_p5.split(), shell=self.isWindows)
            self.process_node.wait()
            self.process_p5.wait()
        except Exception as e:
            log.error(e)
        finally:
            self.process_node.terminate()
            self.process_p5.terminate()
            log.info("Terminating..")
            import sys
            sys.exit()
