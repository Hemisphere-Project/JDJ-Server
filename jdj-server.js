
// CONFIG
var PORT_WS = 8088;
var PORT_PUB = 8081;
var PORT_TIME = 8082;

// LIBS
var Servers = require('./servers');

function execute(sTS) {
  delete STATE.pendingTasks[sTS];
  delete TASKS[sTS];
  console.log('Task consumed');
}

// JDJ SERVER
var STATE = {
    serverState: {
      clientCount: 0,
      controllerCount: 0
    },
    pendingTasks: {}
};

var TASKS = {};

// STATE OBSERVER (Auto Send updates to RemoteCtrls)
var STATEOBSERVER = new Servers.Observer(STATE.serverState, function() { REMOTECTRL.sendStatus(STATE) });
var TASKSOBSERVER = new Servers.Observer(STATE.pendingTasks, function() { REMOTECTRL.sendStatus(STATE) });

  // TIME SERVER
var TIMESERVER = new Servers.TimeServer(PORT_TIME);

  // PUBLISHER
var PUBLISHER = new Servers.Publisher(PORT_PUB);
PUBLISHER.onSubscribe = function(fd, ep) { STATE.serverState.clientCount++; }
PUBLISHER.onUnsubscribe = function(fd, ep) { STATE.serverState.clientCount--; }

// CONTROLLER
var REMOTECTRL = new Servers.RemoteCtrl(PORT_WS);
REMOTECTRL.onConnect = function(client) { STATE.serverState.controllerCount++ };
REMOTECTRL.onDisconnect = function(client) { STATE.serverState.controllerCount-- };
REMOTECTRL.onRequest = function(client, data) {
  //extract unique server goal time
  var servTS = new Date();
  servTS.setSeconds(servTS.getSeconds() + data.when);
  while (STATE.pendingTasks.hasOwnProperty("TS"+servTS)) { servTS++; }

  //setup execution timer and add to pending tasks
  STATE.pendingTasks["TS"+servTS] = data;
  TASKS["TS"+servTS] = (new Servers.ExecuteTimer(servTS, function(){ execute("TS"+servTS) })).start();
};
REMOTECTRL.onHello = function(client) {
  console.log('WebController said hello');
  client.emit('status', { hello: 'you' });
  PUBLISHER.send("Hello everyone !");
};


var ip = require( 'os' ).networkInterfaces( ).eth0[0].address;
console.log("Server Ready - "+ip+" - WS: "+PORT_WS+" - PUB: "+PORT_PUB+" - TIME: "+PORT_TIME);
