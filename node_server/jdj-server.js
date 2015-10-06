
// CONFIG
var PORT_WS = 8088;
var PORT_PUB = 8081;
var PORT_TIME = 8082;

// LIBS
var Servers = require('./servers');

function dispatch(task) {
  console.log('Task dispatched');
  console.log(task);
}

// SERVER MANAGER
var SERVERSTATE = new Servers.ServerState();

// TASK MANAGER
var TASKMANAGER = new Servers.TaskManager(dispatch);

// STATE OBSERVER (Auto Send updates to RemoteCtrls)
var STATEOBSERVER = new Servers.Observer(SERVERSTATE.serverState,
                                          function() { REMOTECTRL.send("status", SERVERSTATE.serverState) });
var TASKSOBSERVER = new Servers.Observer(TASKMANAGER.pendingTasks,
                                          function() { REMOTECTRL.send("tasks", TASKMANAGER.pendingTasks) });

  // TIME SERVER
var TIMESERVER = new Servers.TimeServer(PORT_TIME);

  // PUBLISHER
var PUBLISHER = new Servers.Publisher(PORT_PUB);
PUBLISHER.onSubscribe = function(fd, ep) { SERVERSTATE.addClient(fd,ep); }
PUBLISHER.onUnsubscribe = function(fd, ep) { SERVERSTATE.removeClient(fd,ep); }

// CONTROLLER
var REMOTECTRL = new Servers.RemoteCtrl(PORT_WS);
REMOTECTRL.onConnect = function(client) {
  SERVERSTATE.addController(client);
  TASKSOBSERVER.trigger();
};
REMOTECTRL.onDisconnect = function(client) {
  SERVERSTATE.removeController(client);
};
REMOTECTRL.onRequest = function(client, data) {
  TASKMANAGER.addTask(data);
};
REMOTECTRL.onHello = function(client) {
  console.log('WebController said hello');
  client.emit('status', { hello: 'you' });
  PUBLISHER.send("Hello everyone !");
};


//var ip = require( 'os' ).networkInterfaces( ).eth0[0].address;
console.log("Server Ready - WS: "+PORT_WS+" - PUB: "+PORT_PUB+" - TIME: "+PORT_TIME);
