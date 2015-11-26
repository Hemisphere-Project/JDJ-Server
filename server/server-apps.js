var zmq = require('zmq');
var SocketIO = require('socket.io');

module.exports = {

  Publisher: function (port, server) {
    var that = this;

    // tasks server
    this.server = server;

    // Bind to server events
    this.server.sendTask = function(task) {
      that.send(JSON.stringify(task));
      //console.log('task sent to APPS');
      //console.log(task);
    };

    // Last Value Cache
    this.lvc = null;

    // ZMQ socket
    this.socket = zmq.socket('pub');
    this.socket.bindSync('tcp://*:'+port);

    // Send shortcut
    this.send = function(msg) {
      this.socket.send(msg);
      this.lvc = msg;
    }

    // Monitor events
    /*this.socket.on('monitor_error', function(err) {
        console.log('Error in monitoring: %s, will restart monitoring in 5 seconds', err);
        setTimeout(function() { that.socket.monitor(100, 0); }, 5000);
    });*/

    // Connect / Disconnect events
    /*ùthis.socket.on('accept', function(fd, ep) {
      that.server.addClient(fd, ep);

      // New Client: we redistribute the last order
      if (that.lvc != null) { setTimeout(function() {that.socket.send(that.lvc);}, 200); console.log('last value sent');}
    });
    this.socket.on('disconnect', function() {that.server.removeClient});*/

    // Start monitor
    //this.socket.monitor(100, 0);
  },

  Info: function(port, server, publisher, version) {
    var that = this;

    // controlled server
    this.server = server;
    this.publisher = publisher;
    this.version = version;

    // SocketIO websocket
    this.socket = new SocketIO();
    this.socket.listen(port);

    // NEW Client connected
    this.socket.on('connection', function(client){

      // Unregister App client
      client.on('disconnect', function(){
        that.server.removeClient(client);
      });

      // register new App client
      that.server.addClient(client);

      // send HELLO package
      var hellomsg = { version: that.version }
      if (that.publisher.lvc != null) hellomsg.lvc = that.publisher.lvc;
      client.emit('hello', hellomsg);

    });

    this.socket.on('error', function(err) {
        console.log('Socket.io Error: '+err);
    });

    // Emit shortcut
    this.send = function(subject, data) {
      this.socket.emit(subject, data);
    };

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
