import threading as th
from publisher import Publisher
from graphics_open import GraphicsOpen
import logging as log


class Main:
    """ in order to set up threads and manage them,
        this program below uses threading with daemon.
        the process to broadcast is written in below,
        [publisher.py -> proxy.py -> graphics_open.py -> node_subscriber.js] (in order). """

    def __init__(self):
        log.basicConfig(
            level=log.INFO,
            format='[%(asctime)s %(levelname)-8s %(module)-18s %(funcName)-10s %(lineno)4s]: %(message)s'
        )
        # Instances each classes
        self.publisher = Publisher()
        self.graphics_open = GraphicsOpen()
        # Thread which is made to manage each thread
        self.thread_publisher = th.Thread(target=self.publisher.start_therad)
        self.thread_graphics_open = th.Thread(
            target=self.graphics_open.start_thread)
        self.thread_graphics_open.setDaemon(True)   # Daemon
        # append threads to manage
        self.threads = [self.thread_publisher, self.thread_graphics_open]
        for thread in self.threads:
            thread.start()
        self.thread_graphics_open.join()
        log.info("Terminating..")


if __name__ == "__main__":
    main = Main()
