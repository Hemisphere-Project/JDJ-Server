
// CONFIG
var PORT_WS = 8088;
var PORT_PUB = 8081;
var PORT_TIME = 8082;

// LIBS
var Servers = require('./servers');

function execute(sTS) {
  delete STATE.pendingTasks[sTS];
}

// JDJ SERVER
var STATE = {
    clientCount: 0,
    controllerCount: 0,
    pendingTasks: {}
};

// STATE OBSERVER (Auto Send updates to RemoteCtrls)
var STATEOBSERVER = new Servers.Observer(STATE, function(c) { REMOTECTRL.sendStatus(STATE) });

  // TIME SERVER
var TIMESERVER = new Servers.TimeServer(PORT_TIME);

  // PUBLISHER
var PUBLISHER = new Servers.Publisher(PORT_PUB);
PUBLISHER.onSubscribe = function(fd, ep) { STATE.clientCount++; }
PUBLISHER.onUnsubscribe = function(fd, ep) { STATE.clientCount--; }

// CONTROLLER
var REMOTECTRL = new Servers.RemoteCtrl(PORT_WS);
REMOTECTRL.onConnect = function(client) { STATE.controllerCount++ };
REMOTECTRL.onDisconnect = function(client) { STATE.controllerCount-- };
REMOTECTRL.onRequest = function(client, data) {

  console.log('WebController sent request: '+JSON.stringify(data));

  //extract unique server goal time
  var servTS = new Date();
  servTS.setSeconds(servTS.getSeconds() + data.when);
  while (STATE.pendingTasks[servTS] !== null) servTS++;

  console.log('Request servTS: '+servTS);

  //setup execution timer and add to pending tasks
  data.timer = new Servers.ExecuteTimer(servTS, function(){ execute(servTS) });

  console.log('Timer set');

  STATE.pendingTasks[servTS] = data;

  console.log('Task added');

  STATE.pendingTasks[servTS].timer.start();

  console.log('Timer started');

};
REMOTECTRL.onHello = function(client) {
  console.log('WebController said hello');
  client.emit('status', { hello: 'you' });
  PUBLISHER.send("Hello everyone !");
};


var ip = require( 'os' ).networkInterfaces( ).eth0[0].address;
console.log("Server Ready - "+ip+" - WS: "+PORT_WS+" - PUB: "+PORT_PUB+" - TIME: "+PORT_TIME);
