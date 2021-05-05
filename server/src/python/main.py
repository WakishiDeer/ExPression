from proxy import Proxy
import logging as log


class Main:
    """ in order to set up threads and manage them,
        this program below uses threading with daemon.
        the process to broadcast is written in below,
        [publisher.py -> proxy.py -> graphics_open.py -> node_subscriber.js] (in order). """

    def __init__(self):
        log.basicConfig(
            level=log.DEBUG,
            format='[%(asctime)s %(levelname)-8s %(module)-18s %(funcName)-10s %(lineno)4s]: %(message)s'
        )
        # Instances each classes
        self.proxy = Proxy()
        self.proxy.start_thread()

if __name__ == "__main__":
    main = Main()