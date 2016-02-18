var SocketIO = require('socket.io');

module.exports = {

  WebRemote: function (port, server, userbase) {
    var that = this;

    // controlled server
    this.server = server;
    this.userbase = userbase;

    // Bind to server events
    server.onStateChange = function() { that.send("status", that.server.getState() ); };
    server.onTasksChange = function() { that.send("tasks", that.server.getTasks() ); };

    // SocketIO websocket
    this.socket = new SocketIO();
    this.socket.listen(port);

    // NEW Remote interface connected
    this.socket.on('connection', function(client){

      // PLAY task
      client.on('play', function(data){
        data.action = 'play';
        that.server.addTask(data);
      });

      // STOP task
      client.on('stop', function(data){
        if (data === undefined) data = {};
        data.action = 'stop';
        that.server.addTask(data);
      });

      // REMOVE task
      client.on('remove', function(data){
        that.server.removeTask(data);
      });

      // RESTART server
      client.on('restart', function(data){
        var sys = require('sys')
        var exec = require('child_process').exec;
        function puts(error, stdout, stderr) { sys.puts(stdout) }
        exec("pm2 restart jdj", puts);
      });

      // Unregister remote control
      client.on('disconnect', function(){
        that.server.removeController(client)
      });

      // register new remote
      that.server.addController(client);
      that.server.onTasksChange();

      // send Events list
      client.emit('allevents', {
        events: that.userbase.getEvents(),
        currentevent: that.userbase.getCurrentEvent()
      });
    });

    this.socket.on('error', function(err) {
        console.log('Socket.io Error: '+err);
    });

    // Emit shortcut
    this.send = function(subject, data) {
      this.socket.emit(subject, data);
    };

  },



};
