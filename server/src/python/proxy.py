from client_profile import Client
import pprint
import argparse
import zmq
import json
import logging as log
import math
import copy
import threading as th


class Proxy:
    """ This class will get a message from V-A estimation in realtime and
    send it to Node.js via ZeroMQ (Inter Process Communication).
    In other words, this program will work as 'broker' """

    def __init__(self):
        # format for log
        log.basicConfig(
            level=log.INFO,
            format='[%(asctime)s %(levelname)-8s %(module)-18s %(funcName)-10s %(lineno)4s]: %(message)s'
        )
        # command line argument
        self.parser = argparse.ArgumentParser(
            description="Run Emotion Visualization as server")
        self.parser.add_argument(
            '--pilot_experiment', default=False, action='store_true', help="run as pilot-experiment mode")
        self.parser.add_argument(
            '--experiment', default=False, action='store_true', help="run as experiment mode")
        self.parser.add_argument(
            '--screen', default=False, action='store_true', help="run as screen mode")
        self.args = self.parser.parse_args()
        self.is_pilot_experiment = self.args.pilot_experiment
        self.is_experiment = self.args.experiment
        self.is_screen = self.args.screen
        if self.is_pilot_experiment:
            log.info("pilot experiment mode: " + str(self.is_pilot_experiment))
        elif self.is_experiment:
            log.info("experiment mode: " + str(self.is_experiment))
        elif self.is_screen:
            log.info("screen mode: " + str(self.is_screen))
        # to manage clients
        self.client_map = {}
        # for receiving
        self.str_receive = None
        # for sending
        self.json_dict = {}
        self.str_send = None
        # sockets (REQ and REP)
        self._socket_req = None
        self._socket_xsub = None
        self._socket_xpub = None
        # poller (in order to manage sockets)
        self._poller = None
        self._socks = None      # this variable will be a type of dictionary
        # context
        self._context = None
        # setting for proxy
        self.set_proxy()
        # variable for experiment
        self.valence_experiment = 0.0
        self.arousal_experiment = 0.0

    def set_proxy(self):
        self._context = zmq.Context()
        # for node subscriber
        self._socket_xpub = self._context.socket(zmq.XPUB)
        self._socket_xpub.bind("tcp://*:8889")
        # for valence-arousal estimation
        self._socket_xsub = self._context.socket(zmq.XSUB)
        self._socket_xsub.bind("tcp://*:8888")
        # Poller
        self._poller = zmq.Poller()
        self._poller.register(self._socket_xpub, zmq.POLLIN)
        self._poller.register(self._socket_xsub, zmq.POLLIN)

    def start_thread(self):
        log.info("Starting..")
        self.start_proxy()

    def start_proxy(self):
        # Receiving and Sending header (described parameter name)
        while True:
            try:
                self._socks = dict(self._poller.poll(1000))
                if self._socket_xpub in self._socks:
                    print("XPUB:")
                    message = self._socket_xpub.recv_multipart()[0].decode()
                    self._socket_xsub.send_string(message)
                if self._socket_xsub in self._socks:
                    print("XSUB:")
                    # receiving data from each publisher
                    self.str_receive = self._socket_xsub.recv_multipart()[
                        0].decode()
                    print("number of clients: ", Client.client_count)
                    if not self.is_pilot_experiment and not self.is_experiment:
                        self.update_client_map()
                        # calculating whole parameters
                        if Client.client_count != 0:
                            self.calc_va_average()
                            self.calc_va_variance()
                            self.calc_va_sd()
                    # when self.is_pilot_experiment = True,
                    # {randomed order,  details of clients}
                    # when self.is_pilot_experiment = False,
                    # {average, variance, sd, number of clients, details of clients}
                    self.str_send = self.make_json_string()
                    # sending data to each subscriber
                    # (or one subscriber when working with experimental setting)
                    self._socket_xpub.send_string(self.str_send)
                    pprint.pprint(self.str_send)
            except KeyboardInterrupt as e:
                log.info("Keyboard Interruption")
                self.exit_successfully()

    def update_client_map(self):
        # convert string into dict
        map_objective = json.loads(self.str_receive)
        # add or override each client's properties
        self.client_map[map_objective['name']] = copy.copy(map_objective)
        Client.client_count = len(self.client_map)
        # remove each client's properties
        if self.client_map[map_objective['name']]['running'] == 'False':
            del self.client_map[map_objective['name']]
            Client.client_count -= 1

    def calc_va_average(self):
        sum_valence = 0.0
        sum_arousal = 0.0
        for key in self.client_map:
            sum_valence += float(self.client_map[key]['valence'])
            sum_arousal += float(self.client_map[key]['arousal'])
        Client.average_valence = sum_valence / Client.client_count
        Client.average_arousal = sum_arousal / Client.client_count

    def calc_va_variance(self):
        diff_square_valence = 0.0
        diff_square_arousal = 0.0
        for key in self.client_map:
            diff_square_valence += math.pow(Client.average_valence -
                                            float(self.client_map[key]['valence']), 2)
            diff_square_arousal += math.pow(Client.average_arousal -
                                            float(self.client_map[key]['arousal']), 2)
        Client.variance_valence = diff_square_valence / Client.client_count
        Client.variance_arousal = diff_square_arousal / Client.client_count

    def calc_va_sd(self):
        Client.sd_valence = math.sqrt(Client.variance_valence)
        Client.sd_arousal = math.sqrt(Client.variance_arousal)

    def make_json_string(self):
        if self.is_pilot_experiment:
            # pass through
            # (i.e.,    programs of JavaScript can receive message
            #           as same map selected at "image_selector.py")
            return self.str_receive
        elif self.is_experiment:
            return self.str_receive
        else:
            self.json_dict = {
                "average": {
                    "valence": Client.average_valence,
                    "arousal": Client.average_arousal
                },
                "variance": {
                    "valence": Client.variance_valence,
                    "arousal": Client.variance_arousal
                },
                "sd": {
                    "valence": Client.sd_valence,
                    "arousal": Client.sd_arousal
                },
                "clientCount": Client.client_count,
                "clientMap": self.client_map,
                "is_pilot_experiment": self.is_pilot_experiment,
                "is_experiment": self.is_experiment,
                "is_screen": self.is_screen
            }
        return json.dumps(self.json_dict)

    def proxy(self):
        log.info("Starting proxy..")
        zmq.proxy(self._socket_xpub, self._socket_xsub)
        self.exit_successfully()

    def exit_successfully(self):
        self._socket_xsub.close()
        self._socket_xpub.close()
        self._context.destroy()
        log.info("Terminated..")
        import sys
        sys.exit()
