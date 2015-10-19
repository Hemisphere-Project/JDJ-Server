import sys
import time

from random import randint

import zmq

def subscriber():
    ctx = zmq.Context.instance()
    subscriber = ctx.socket(zmq.SUB)
    url = "tcp://localhost:7557"
    subscriber.connect(url)

    subscription = b"%03d" % 3
    # subscription = b""
    subscriber.setsockopt(zmq.SUBSCRIBE, subscription)

    while True:
        topic, data = subscriber.recv_multipart()
        assert topic == subscription
        print data


def timesync():
    ctx = zmq.Context.instance()
    client = ctx.socket(zmq.REQ)
    url = "tcp://localhost:7588"
    client.connect(url)

    #  Do 10 requests, waiting each time for a response
    for request in range(10):
        millis = int(round(time.time() * 1000))
        client.send(str(millis).encode())

        #  Get the reply.
        message = client.recv()
        millis2 = str(int(round(time.time() * 1000))).encode()
        print("%s / %s / %s" % (millis, message, millis2))

        time.sleep(1);


def main():
    timesync()

if __name__ == '__main__':
    main()
