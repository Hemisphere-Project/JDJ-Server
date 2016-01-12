var zmq = require('zmq');
var SocketIO = require('socket.io');

module.exports = {

  AppServer: function(port, server, version, showdate) {
    var that = this;

    // controlled server
    this.server = server;
    this.version = version;
    this.showdate = showdate;

    // Last Value Cache
    this.lvc = null;

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
      var hellomsg = { version: that.version, nextshow: that.showdate }
      if (that.lvc != null) hellomsg.lvc = that.lvc;
      client.emit('hello', hellomsg);

    });

    this.socket.on('error', function(err) {
        console.log('Socket.io Error: '+err);
    });

    // Publish task command to all (and store in lvc cache)
    this.sendTask = function(task) {
      that.send('task', task);
      if (task.cache === true) that.lvc = task;
    }

    // Link with server consumer
    this.server.sendTask = that.sendTask;

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
