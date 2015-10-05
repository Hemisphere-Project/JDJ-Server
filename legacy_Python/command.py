import sys
import time

import zmq

cmds = {}
cmds[0] = "/play http://www.crr93.fr";
cmds[2] = "/play http://airlab.fr";
cmds[1] = "/play http://hls.hmsphr.com/vidz/tears/tears.m3u8";
# cmds[3] = "/play https://devimages.apple.com.edgekey.net/streaming/examples/bipbop_4x3/"+ "bipbop_4x3_variant.m3u8";
#cmds[3] = "/stop"

def main():
    ctx = zmq.Context.instance()
    dealer = ctx.socket(zmq.DEALER)
    dealer.connect("tcp://localhost:7556")
    poll = zmq.Poller()
    poll.register(dealer, zmq.POLLIN)

    while True:
        for cmd in cmds.values():
            # Send
            print('Req sent: {0}'.format(cmd))
            dealer.send_multipart([ b"zenner", b"{0}".format(cmd) ])
            # Receive (and sleep..)
            poller = dict(poll.poll(15000))
            if dealer in poller:
                msg = dealer.recv()
                tprint('Client %s received: %s' % (identity, msg))


if __name__ == '__main__':
    main()
