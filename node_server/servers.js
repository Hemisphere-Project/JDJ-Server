var zmq = require('zmq');
var SocketIO = require('socket.io');

module.exports = {

  TaskManager: function(fn_dispatch) {
    var that = this;
    this.serverState = {
      clientCount: 0,
      controllerCount: 0
    }
    this.pendingTasks = {};
    this.timersTasks = {};
    this.dispatcher = fn_dispatch;

    this.addTask = function(task) {
      //extract unique server goal time
      var now = new Date();
      serverTimestamp = now.setSeconds(now.getSeconds() + task.when).getTime();
      while (that.pendingTasks.hasOwnProperty(serverTimestamp)) { serverTimestamp++; }

      //setup execution timer and add to pending tasks
      this.pendingTasks[serverTimestamp] = data;
      this.timersTasks[serverTimestamp] = new ExecuteTimer(serverTimestamp, that.consumeTask );
    };

    this.consumeTask = function(timestamp) {
      var task = this.pendingTasks[timestamp];
      // remove Task from queue
      this.removeTask(timestamp);
      // send Task to dispatcher
      this.dispatcher(task);
      console.log('Task consumed');
    };

    this.removeTask = function(timestamp) {
      // stop and remove timer
      that.timersTasks[timestamp].stop();
      delete that.timersTasks[timestamp];
      // remove from pending queue
      delete that.pendingTasks[timestamp];
    };

    this.getState = function() {
      return this.serverState;
    };

    this.getTasks = function() {
      return this.pendingTasks;
    };

  },

  ExecuteTimer: function(atTime, fn) {
    var that = this;
    this.atTime = atTime;
    this.timerjs = null;
    this.callback = fn;
    this.start = function() {
      var delay = Math.max(1, (atTime-(new Date()).getTime()));
      this.timerjs = setTimeout(fn, delay);
    };
    this.stop = function() { clearTimeout(this.timerjs) };

    this.start();
  },

  Observer: function(obj, callback) {
    var that = this;
    this.object = obj;
    this.callback = callback;
    this.dirty = false;
    this.timerjs = null;

    this.onMove = function(c) { that.dirty=true };

    this.start = function() {
      this.dirty = false;
      Object.observe(that.object, that.onMove );
      this.timerjs = setInterval(function() { if (that.dirty) that.callback(); that.dirty=false; }, 500);
    };
    this.stop = function() {
      Object.unobserve(that.object, that.onMove );
      clearInterval(that.timerjs);
    };

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
    this.onDisconnect = function(client) { };
    this.onHello = function(client) { console.log('WebController said hello'); };
    this.onRequest = function(client, data) { console.log('WebController sent request: '+JSON.stringify(data)); };

    // onConnection event shortcut
    this.socket.on('connection', function(client){
      client.on('disconnect', function(){ that.onDisconnect(client) });
      client.on('hello', function(){ that.onHello(client) });
      client.on('request', function(data){ that.onRequest(client, data) });
      that.onConnect(client);
    });

    // Emit shortcut
    this.send = function(subject, data) {
      this.socket.emit(subject, data);
    };

  }

};
