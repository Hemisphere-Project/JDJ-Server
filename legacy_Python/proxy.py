import sys
import time

import zmq
from zmq.eventloop.ioloop import IOLoop, PeriodicCallback
from zmq.eventloop.zmqstream import ZMQStream

COMMANDPORT = 5556
PUBLISHPORT = 5557

def freeport(port):
    from subprocess import call
    call( "fuser -n tcp -k {0}".format(port).split() )


class CommandProxy(object):

    ctx = None                  # Context wrapper
    loop = None                 # IOLoop reactor
    port_cmd = None             # PORT to receive commands
    port_pub = None             # PORT to publish commands
    router = None               # CMD Router (receive commands)
    publisher = None            # Publish updates to clients
    poller = None               # Common Poller
    cache = {}                  # Last Value cache for each channel

    def __init__(self, port_cmd, port_pub):
        self.port_cmd = port_cmd
        self.port_pub = port_pub
        self.ctx = zmq.Context()

        # Set up CMD Router
        self.router = self.ctx.socket(zmq.ROUTER)
        freeport(self.port_cmd)
        self.router.bind("tcp://*:%d" % self.port_cmd)

        # Set up PUBlisher
        self.publisher = self.ctx.socket(zmq.XPUB)
        freeport(self.port_pub)
        self.publisher.bind("tcp://*:%d" % self.port_pub)

        # Set up POLLER
        self.poller = zmq.Poller()
        self.poller.register(self.router, zmq.POLLIN)
        self.poller.register(self.publisher, zmq.POLLIN)

    def start(self):
        # Poller Loop
        while True:
            try:
                # Event receptor
                events = dict(self.poller.poll(1000))

                # Command handler
                if self.router in events:
                    self.command_received(self.router.recv_multipart())

                # Subscription handler
                if self.publisher in events:
                    self.client_connection(self.publisher.recv())

            except KeyboardInterrupt:
                print "interrupted"
                break

    def publish(self, channel, data):
        # shortened method to publish
        self.publisher.send_multipart([ channel, b"{0}".format(data) ])

    def client_connection(self, msg):
        # Handle sub/unsub events on the publisher
        channel = msg[1:]
        if msg[0] == b'\x01':
            print 'New subscriber on Channel {0}'.format(channel)
            # Send welcome message
            self.publish(channel, "Welcome on Channel {0}".format(channel) )
            # Send last value from Cache
            if channel in self.cache:
                self.publish(channel, self.cache[channel] )
        elif msg[0] == b'\x00':
            print 'Subscriber lost on Channel {0}'.format(channel)

    def command_received(self, msg):
        # Handle new command received on router
        identity, channel, data = msg
        # print 'Command received on Channel {0}: {1}'.format(channel, data)
        self.cache[channel] = data
        self.publish(channel, data)


def main():
    proxy = CommandProxy(COMMANDPORT, PUBLISHPORT)
    proxy.start()

if __name__ == '__main__':
    main()
