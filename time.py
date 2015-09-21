import sys
import time
import random

import zmq

def main():
    context = zmq.Context()
    socket = context.socket(zmq.REP)
    socket.bind("tcp://*:7588")

    while True:

        #randelay = random.randint(100,500)

        #  Wait for next request from client
        message = socket.recv()

        # simulate REQ delay
        #time.sleep(randelay/2000.0)

        #  Send current time back to client
        millis = int(round(time.time() * 1000))

        # simulate REP delay
        #time.sleep(randelay/2000.0)

        socket.send(str(millis))
        # print("Time sent: %i" % millis)

if __name__ == '__main__':
    main()
