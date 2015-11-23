
// CONFIG
var PORT_WS = 8088;
var PORT_PUB = 8081;
var PORT_TIME = 8082;

var PUB_DELAY = 1998;

var BASEURL = 'http://app.journaldunseuljour.fr/';

// LIBS
var Engine = require('./server-engine');
var Fs = require('fs')

function dispatch(task) {
  console.log('Task dispatched');
  console.log(task);
}

// SERVER MANAGER
var SERVERSTATE = new Engine.State();
SERVERSTATE.onChange = function() { REMOTECTRL.send("status", SERVERSTATE.getState()) };

// TASK MANAGER
var TASKMANAGER = new Engine.Tasks();
TASKMANAGER.onChange = function() { REMOTECTRL.send("tasks", TASKMANAGER.getTasks()) };
TASKMANAGER.onConsume = function(task) {
  //console.log('start consuming task');
  // clean up task
  var channel = 'all';
  if (task.who !== undefined) {channel = task.who; delete task.who; }
  if (task.localTime !== undefined) delete task.localTime;
  if (task.when !== undefined) delete task.when;

  // PLAY something
  if (task.action == 'play') {

    // URL: convert .url files to actual url
    if (task.category == 'url') {
      try {
        task.url = Fs.readFileSync('../files/'+task.filename, 'utf8');
      } catch (e) { console.log(e); return;}
    }
    // TXT: handle .txt as SMS
    if (task.category == 'txt') {
      try {
        var sms = Fs.readFileSync('../files/'+task.filename, 'utf8');

      } catch (e) { console.log(e);}
      return;
    }
    // RAW CONTENT
    else task.url = BASURL+'files/'+task.filename;

  }

  // Add transmission delay
  task.atTime = (new Date()).getTime() + PUB_DELAY;

  // publish
  PUBLISHER.send(channel, JSON.stringify(task));
  //console.log('finnished consuming task');
};

// TIME SERVER
var TIMESERVER = new Engine.TimeServer(PORT_TIME);

// PUBLISHER
var PUBLISHER = new Engine.Publisher(PORT_PUB);
PUBLISHER.onSubscribe = function(fd, ep) { SERVERSTATE.addClient(fd,ep); }
PUBLISHER.onUnsubscribe = function(fd, ep) { SERVERSTATE.removeClient(fd,ep); }

// CONTROLLER
var REMOTECTRL = new Engine.WebRemotes(PORT_WS);
REMOTECTRL.onConnect = function(client) {
  SERVERSTATE.addController(client);
  TASKMANAGER.onChange();
  //console.log('Socket.io RC connected ');
};
REMOTECTRL.onDisconnect = function(client) {
  SERVERSTATE.removeController(client);
  //console.log('Socket.io RC disconnected ');
};
REMOTECTRL.onPlay = function(client, data) {
  //console.log(data);
  data.action = 'play';
  TASKMANAGER.addTask(data);
};
REMOTECTRL.onStop = function(client, data) {
  //console.log(data);
  if (data === undefined) data = {};
  data.action = 'stop';
  TASKMANAGER.addTask(data);
};
REMOTECTRL.onRemove = function(client, data) {
  TASKMANAGER.removeTask(data);
};
REMOTECTRL.onHello = function(client) {
  console.log('WebController said hello');
  client.emit('status', { hello: 'you' });
  PUBLISHER.send("all", "Hello everyone !");
};


//var ip = require( 'os' ).networkInterfaces( ).eth0[0].address;
console.log("Server Ready - WS: "+PORT_WS+" - PUB: "+PORT_PUB+" - TIME: "+PORT_TIME);
