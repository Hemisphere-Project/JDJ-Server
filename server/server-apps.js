var zmq = require('zmq');
var SocketIO = require('socket.io');

module.exports = {

  AppServer: function(port, server, version, userbase, userinterface) {
    var that = this;

    // controlled server
    this.server = server;
    this.version = version;
    this.userbase = userbase;
    this.userinterface = userinterface;

    // Bind to userinterface event
    this.userinterface.onUserUpdated = function(userinfo) { that.sendInfo(userinfo); };

    // Last Value Cache
    this.lvc = null;

    // SocketIO websocket
    this.socket = new SocketIO();
    this.socket.listen(port);

    // NEW Client connected
    this.socket.on('connection', function(client){

      // register App & create userID in client
      client.userid = null;
      that.server.addClient(client);

      // Client send his ID, answer with server version / lvc and user state
      client.on('iam', function(data){
        console.log('iam :'+JSON.stringify(data));
        var userinfo = that.userbase.getUser(data.userid);
        that.isConnected(client, userinfo.id);
        that.sendInfo(userinfo);
      });

      // New Client want to subscribe (or update info)
      client.on('subscribe', function(data)
      {
        console.log('subscribe :'+JSON.stringify(data));
        // check if user already exist or get a fresh one
        var newuser = that.userbase.getUser(data.userid);
        // check if number correspond to exisiting user
        //if (newuser.id == null) newuser = that.userbase.getUserByNumber(data.number);

        // update data
        newuser.number = data.number;
        newuser.event = that.userbase.getShowById(data.showid);
        newuser.os = data.os;
        newuser.group = 'group1';

        // check if valid, and save
        newuser = that.userbase.saveUser(newuser);

        // sendHello
        that.isConnected(client, newuser.id);
        that.sendInfo(newuser);
      });

      // Unregister App client
      client.on('disconnect', function(){
        that.userbase.userState(client.userid, false);
        console.log("client disconnected "+client.userid);
        that.server.removeClient(client);
      });

      // send WHOAREYOU package
      client.emit('whoareyou');
      console.log('whoareyou ?');

    });

    this.socket.on('error', function(err) {
        console.log('Socket.io Error: '+err);
    });



    // Emit shortcut
    this.send = function(subject, data) {
      this.socket.emit(subject, data);
    };

    // Publish task command to all (and store in lvc cache)
    this.sendTask = function(task) {
      that.send('task', task);
      if (task.cache === true) that.lvc = task;
    }

    // Link with server consumer
    this.server.sendTask = that.sendTask;

    // Is Connected
    this.isConnected = function(client, userid) {
      // store id in socketio client (for disconnect) an register connection
      client.userid = userid;
      this.userbase.userState(userid, true);
    }

    // Send Hello package
    this.sendInfo = function(userinfo) {

      // find client corresponding to user
      client = null;
      clients = that.socket.sockets.connected;
      for (var cli in clients)
        if (clients[cli].userid == userinfo.id) client = clients[cli];

      if (client == null) {
        console.log('Client not connected...');
        return;
      }

      // send Hello package with userinfo
      var hellomsg = { version: that.version, user: userinfo }
      if (that.lvc != null) hellomsg.lvc = that.lvc;

      // If user is new or with error, provide show list
      if (userinfo.id == null || userinfo.error != null) {
        hellomsg.showlist = that.userbase.getEvents();
      }

      console.log('send:'+JSON.stringify(hellomsg.user));
      client.emit('hello', hellomsg);
    }

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
