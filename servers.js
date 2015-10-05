var zmq = require('zmq');
var SocketIO = require('socket.io');
var O = require('observed');

module.exports = {

  Observer: function(obj, callback) {
    var that = this;
    this.object = obj;
    this.callback = callback;
    this.observer = null;

    this.start = function() {
      this.observer = O(that.object);
      this.observer.on('change', that.callback);
    };
    this.stop = function() { this.observer.stop(); };

    this.start();
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
  },

  Publisher: function (port) {
    // ZMQ socket
    this.socket = zmq.socket('pub');
    this.socket.bindSync('tcp://*:'+port);

    // Public events (to overwrite)
    this.onSubscribe = function (fd, ep) { };
    this.onUnsubscribe = function (fd, ep) { };

    // Send shortcut
    this.send = function(msg) {
      this.socket.send(["zenner", msg]);
    }

    // Monitor events
    var that = this;
    this.socket.on('monitor_error', function(err) {
        console.log('Error in monitoring: %s, will restart monitoring in 5 seconds', err);
        setTimeout(function() { that.socket.monitor(100, 0); }, 5000);
    });

    // Connect / Disconnect events
    this.socket.on('accept', function(fd, ep) {
    	that.onSubscribe(fd, ep);
    });
    this.socket.on('disconnect', function(fd, ep) {
      that.onUnsubscribe(fd, ep);
    });

    // Start monitor
    this.socket.monitor(100, 0);
  },

  RemoteCtrl: function (port) {
    var that = this;

    // SocketIO websocket
    this.socket = new SocketIO();
    this.socket.listen(port);

    // Public events (to overwrite)
    this.onConnect = function(client) { };
    this.onDisconnect = function() { };
    this.onHello = function() { };

    // onConnection event shortcut
    this.socket.on('connection', function(client){
      client.on('disconnect', function(){ that.onDisconnect(client) });
      client.on('hello', function(){ that.onHello(client) });
      that.onConnect(client);
    });

    // Emit "status" shortcut
    this.sendStatus = function(data) {
      this.socket.emit("status", data);
    }

  }

};
