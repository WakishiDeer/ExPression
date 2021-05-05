import zmq
import logging as log


class SubscriberTest:
    def __init__(self):
        self.port = "5557"
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.SUB)
        self.socket.setsockopt_string(zmq.SUBSCRIBE, '')
        self.socket.connect("tcp://localhost:" + self.port)

    def start_thread(self):
        log.debug("Starting..")
        self.receive()

    def receive(self):
        while True:
            string = self.socket.recv_string()
            print(string)

