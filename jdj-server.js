

// LIBS
var Servers = require('./servers');

// JDJ SERVER
var STATE = {
    clientCount: 0,
    controllerCount: 0,
    pendingTasks: {}
};

// STATE OBSERVER (Auto Send updates to RemoteCtrls)
var STATEOBSERVER = new Servers.Observer(STATE, function(c) { REMOTECTRL.sendStatus(STATE) });

  // TIME SERVER
var TIMESERVER = new Servers.TimeServer(8082);

  // PUBLISHER
var PUBLISHER = new Servers.Publisher(8081);
PUBLISHER.onSubscribe = function(fd, ep) { STATE.clientCount++; }
PUBLISHER.onUnsubscribe = function(fd, ep) { STATE.clientCount--; }

// CONTROLLER
var REMOTECTRL = new Servers.RemoteCtrl(8088);
REMOTECTRL.onConnect = function(client) { STATE.controllerCount++ };
REMOTECTRL.onDisconnect = function(client) { STATE.controllerCount-- };
REMOTECTRL.onHello = function(client) {
  console.log('WebController said hello');
  client.emit('status', { hello: 'you' });
  PUBLISHER.send("Hello everyone !");
};
