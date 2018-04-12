var zmq = require('zmq');
var SocketIO = require('socket.io');
var _ = require('underscore');
var https = require('https'),
    http = require('http'),
    fs =    require('fs');

module.exports = {

  AppServer: function(portSSL, port, server) {
    var that = this;

    // controlled server
    this.server = server;
    this.version = server.version;
    this.userbase = server.USERBASE;
    this.userinterface = server.USERSCTRL;

    // Last Value Cache
    this.lvc = {};

   /*var options = {
        key:    fs.readFileSync('/etc/ssl/currents/app.journaldunseuljour.fr.key'),
        cert:   fs.readFileSync('/etc/ssl/currents/app.journaldunseuljour.fr.crt'),
        ca:     fs.readFileSync('/etc/ssl/currents/GandiStandardSSLCA2.pem')
    };
    var app = https.createServer(options);
    this.socket = require('socket.io').listen(app);     //socket.io server listens to https connections
    app.listen(port, "0.0.0.0");*/

    var fs = require('fs');
    var net = require('net');
    var tls = require('tls');
    var sslOptions = {
        //key:    fs.readFileSync('/etc/ssl/olds/app.journaldunseuljour.fr.key'),
        //cert:   fs.readFileSync('/etc/ssl/olds/app.journaldunseuljour.fr.crt'),
        //ca:     fs.readFileSync('/etc/ssl/olds/GandiStandardSSLCA2.pem')
        key:    fs.readFileSync('/etc/letsencrypt/live/app.journaldunseuljour.fr/privkey.pem'),
        cert:   fs.readFileSync('/etc/letsencrypt/live/app.journaldunseuljour.fr/fullchain.pem')
    };
    tls.createServer(sslOptions, function (cleartextStream) {
        var cleartextRequest = net.connect({
            port: port,
            host: '127.0.0.1'
        }, function () {
            cleartextStream.pipe(cleartextRequest);
            cleartextRequest.pipe(cleartextStream);
        });
    }).listen(portSSL);


    this.socket = new SocketIO();
    this.socket.listen(port);

    // NEW Client connected
    this.socket.on('connection', function(client){

      // register App & create userID in client
      client.userid = null;

      // Client send his ID, answer with server version / lvc and user state
      client.on('iam', function(data){
        //console.log('iam :'+JSON.stringify(data));
        var userinfo = that.userbase.getUser(data.userid);
        that.isConnected(client, userinfo.id);
        that.sendInfo(userinfo);
      });

      // New Client want to subscribe (or update info)
      client.on('subscribe', function(data)
      {
        // console.log('subscribe :'+JSON.stringify(data));
        // console.log("New Subscription");
        // check if user already exist or get a fresh one
        var newuser = that.userbase.getUser(data.userid);
        if (newuser.id == null){
          newuser = that.userbase.getUserByNumber(data.number);
        }

        // update data
        newuser.number = data.number;
        newuser.event = that.userbase.getShowById(data.showid);
        newuser.os = data.os;
        if (newuser.group == null)
          newuser.group = that.userbase.chooseGroup(['group1', 'group2']);

        // check if valid, and save
        //console.log(data);
        newuser = that.userbase.saveUser(newuser);

        // sendHello
        that.isConnected(client, newuser.id);
        that.sendInfo(newuser, (newuser.id == null) );
      });

      // Unregister App client
      client.on('disconnect', function(){
        if (client.userid != null) {
          that.userbase.userState(client.userid, false);
          that.userinterface.send('stateuser', {id: client.userid, state: false});
          that.server.removeClient(client.userid);
        }
      });

      // send WHOAREYOU package
      client.emit('whoareyou');
      //console.log('whoareyou ?');

    });

    this.socket.on('error', function(err) {
        console.log('Socket.io Error: '+err);
    });



    // Emit shortcut
    this.send = function(subject, data) {
      if (data.eventid !== undefined && data.eventid !== null && data.eventid >= 0) {
        this.socket.to('event-'+data.eventid).emit(subject, data);
        console.log('sent to room event-'+data.eventid, data);
      }
      else this.socket.emit(subject, data);
    };

    // Publish task command to all (and store in lvc cache)
    this.sendTask = function(task) {
      that.send('task', task);
      if (task.cache === true) that.lvc[task.eventid] = task;
    }

    // Link with server consumer
    this.server.sendTask = that.sendTask;

    // Is Connected
    this.isConnected = function(client, userid) {

      // store id in socketio client (for disconnect) an register connection

      if (userid != null) {

        // de-associate other clients from this id
        var newClient = true;
        clients = that.socket.sockets.connected;
        for (var cli in clients) //console.log(cli+" "+client.id);
          if (clients[cli].userid == userid)
          {
            if (cli != client.id) {
              console.log("User "+userid+" moved from "+cli+" to "+client.id)
              clients[cli].userid = null;
            }
            newClient = false;
          }

        // associate client with user
        client.userid = userid;
        this.userbase.userState(userid, true);
        this.userinterface.send('stateuser', {id: userid, state: true});
        if (newClient) that.server.addClient(userid);

        // link client to ROOM
        var userinfo = that.userbase.getUser(userid);
        if (userinfo.event)
          if (userinfo.event.id !== undefined && userinfo.event.id !== null && userinfo.event.id >= 0)
          {
            client.join('event-'+userinfo.event.id);
            console.log('client added to room event-'+userinfo.event.id);
          }
      }
    }

    // Send Hello package
    this.sendInfo = function(userinfo) {

      // find client corresponding to user
      client = null;
      clients = that.socket.sockets.connected;
      for (var cli in clients)
        if (clients[cli].userid == userinfo.id) client = clients[cli];

      if (client == null) {
        //console.log('Client not connected...');
        return;
      }


      // send Hello package with userinfo
      var hellomsg = { version: that.version, user: userinfo }
      //console.log(userinfo.event.id, that.lvc[userinfo.event.id]);
      if (userinfo.event && that.lvc[userinfo.event.id] != null)
        hellomsg.lvc = that.lvc[userinfo.event.id];
			
			hellomsg.currentshow = that.userbase.getCurrentEvent();
			
			// build show list with future dates AND already selected one for user
      hellomsg.showlist = that.userbase.getFutureEvents();
      if (userinfo.event && _.indexOf(hellomsg.showlist, userinfo.event) == -1 )
		    hellomsg.showlist.unshift(userinfo.event);

      hellomsg.info = "Le spectacle est en cours, restez connecté !";

      //console.log('send:'+JSON.stringify(hellomsg));
      client.emit('hello', hellomsg);
    }

    this.sendEvents = function() {
      var hellomsg = { showlist: that.userbase.getEvents(), currentshow: that.userbase.getCurrentEvent()}
      clients = that.socket.sockets.connected;
      for (var cli in clients)
        clients[cli].emit('hello', hellomsg);
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
      //console.log(new Date())
    });
  }

};
