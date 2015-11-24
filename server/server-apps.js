var zmq = require('zmq');

module.exports = {

  Publisher: function (port, server) {

    // tasks server
    this.server = server;

    // Bind to server events
    this.server.sendTask = function(task) {
      that.send(task.group, JSON.stringify(task));
      //console.log('task sent to APPS');
      //console.log(task);
    };

    // Last Value Cache
    this.lvc = null;

    // ZMQ socket
    this.socket = zmq.socket('pub');
    this.socket.bindSync('tcp://*:'+port);

    // Send shortcut
    this.send = function(grp, msg) {
      this.socket.send([grp, msg]);
      this.lvc = [grp, msg];
    }

    // Monitor events
    var that = this;
    this.socket.on('monitor_error', function(err) {
        console.log('Error in monitoring: %s, will restart monitoring in 5 seconds', err);
        setTimeout(function() { that.socket.monitor(100, 0); }, 5000);
    });

    // Connect / Disconnect events
    this.socket.on('accept', function(fd, ep) {
      that.server.addClient(fd, ep);

      // New Client: we redistribute the last order
      if (that.lvc != null) {that.socket.send(that.lvc); console.log('last value sent');}
    });
    this.socket.on('disconnect', that.server.removeClient);

    // Start monitor
    this.socket.monitor(100, 0);
  },

  TimeServer: function(port) {
    // ZMQ socket
    this.socket = zmq.socket('rep');
    this.socket.bindSync('tcp://*:'+port);

    // onMessage event: send system time
    var that = this;
    this.socket.on('message', function(msg) {
      that.socket.send((new Date()).getTime().toString());
    });
  }

};
