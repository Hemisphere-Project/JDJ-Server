
// CONFIG
var PORT_WS = 8088;
var PORT_PUB = 8081;
var PORT_TIME = 8082;

// LIBS
var Engine = require('./server-engine');

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
  if (task.who === null || task.who === undefined) task.who = 'all';
  PUBLISHER.send(task.who, JSON.stringify(task));
};

// TIME SERVER
var TIMESERVER = new Engine.TimeServer(PORT_TIME);

// PUBLISHER
var PUBLISHER = new Engine.Publisher(PORT_PUB);
PUBLISHER.onSubscribe = function(fd, ep) { SERVERSTATE.addClient(fd,ep); PUBLISHER.send("all", "A new client joined the party !");}
PUBLISHER.onUnsubscribe = function(fd, ep) { SERVERSTATE.removeClient(fd,ep); }

// CONTROLLER
var REMOTECTRL = new Engine.WebRemotes(PORT_WS);
REMOTECTRL.onConnect = function(client) {
  SERVERSTATE.addController(client);
  TASKMANAGER.onChange();
};
REMOTECTRL.onDisconnect = function(client) {
  SERVERSTATE.removeController(client);
};
REMOTECTRL.onPlay = function(client, data) {
  data.action = 'play';
  TASKMANAGER.addTask(data);
};
REMOTECTRL.onStop = function(client, data) {
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
