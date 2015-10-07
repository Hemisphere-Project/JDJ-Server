var zmq = require('zmq');
var SocketIO = require('socket.io');
var Tools = require('./server-utils');

module.exports = {

  State: function() {
    var that = this;
    this.serverState = {
      clientCount: 0,
      controllerCount: 0
    };

    // Auto observer: trigger onChange
    this.observer = new Tools.Observer(that.serverState, function(){ that.onChange()});

    // Public events (to overwrite)
    this.onChange = function() { };

    this.addClient = function(fd, ep) {
      this.serverState.clientCount++;
    };

    this.removeClient = function(fd, ep) {
      this.serverState.clientCount--;
    };

    this.addController = function(client) {
      this.serverState.controllerCount++;
    };

    this.removeController = function(client) {
      this.serverState.controllerCount--;
    };

    this.getState = function() {
      return this.serverState;
    };

  },

  Tasks: function() {
    var that = this;

    this.pendingTasks = {};
    this.timersTasks = {};

    // Auto observer: trigger onChange
    this.observer = new Tools.Observer(that.pendingTasks, function(){ that.onChange()});

    // Public events (to overwrite)
    this.onChange = function() { };
    this.onConsume = function(task) { };

    this.addTask = function(task) {
      //extract unique server goal time
      var now = new Date();
      now.setSeconds(now.getSeconds() + task.when);
      var serverTimestamp = now.getTime();
      while (that.pendingTasks.hasOwnProperty(serverTimestamp)) { serverTimestamp++; }

      //setup execution timer and add to pending tasks
      this.pendingTasks[serverTimestamp] = task;
      this.timersTasks[serverTimestamp] = new Tools.ExecuteTimer(serverTimestamp, that.consumeTask );
    };

    this.consumeTask = function(timestamp) {
      var task = that.removeTask(timestamp); // remove Task from queue
      that.onConsume(task); // send Task to consumer
    };

    this.removeTask = function(timestamp) {
      // stop and remove timer
      if (that.timersTasks[timestamp] !== undefined)
        that.timersTasks[timestamp].stop();
      delete that.timersTasks[timestamp];
      // remove from pending queue and return it
      var task = that.pendingTasks[timestamp];
      delete that.pendingTasks[timestamp];
      return task;
    };

    this.getTasks = function() {
      return this.pendingTasks;
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
  },

  Publisher: function (port) {
    // ZMQ socket
    this.socket = zmq.socket('pub');
    this.socket.bindSync('tcp://*:'+port);

    // Public events (to overwrite)
    this.onSubscribe = function (fd, ep) { };
    this.onUnsubscribe = function (fd, ep) { };

    // Send shortcut
    this.send = function(grp, msg) {
      this.socket.send([grp, msg]);
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

  WebRemotes: function (port) {
    var that = this;

    // SocketIO websocket
    this.socket = new SocketIO();
    this.socket.listen(port);

    // Public events (to overwrite)
    this.onConnect = function(client) { };
    this.onDisconnect = function(client) { };
    this.onHello = function(client) { console.log('WebController said hello'); };
    this.onPlay = function(client, data) { console.log('WebController sent PLAY request: '+JSON.stringify(data)); };
    this.onStop = function(client, data) { console.log('WebController sent STOP request: '+JSON.stringify(data)); };
    this.onRemove = function(client, data) { console.log('WebController wants to remove: '+data); };

    // onConnection event shortcut
    this.socket.on('connection', function(client){
      client.on('disconnect', function(){ that.onDisconnect(client) });
      client.on('hello', function(){ that.onHello(client) });
      client.on('play', function(data){ that.onPlay(client, data) });
      client.on('stop', function(data){ that.onStop(client, data) });
      client.on('remove', function(data){ that.onRemove(client, data) });
      that.onConnect(client);
    });

    // Emit shortcut
    this.send = function(subject, data) {
      this.socket.emit(subject, data);
    };

  }

};
