
// CONFIG
var PORT_WS_TELECO = 8088;
var PORT_WS_PAD = 8089;
var PORT_PUB = 8081;
var PORT_TIME = 8082;

var PUB_DELAY = 1998;

var BASEURL = 'http://app.journaldunseuljour.fr/';
var PADREADER = 'pad/reader.html';

// LIBS
var Engine = require('./server-engine');
var Remote = require('./server-remote');
var Apps = require('./server-apps');
var Pad = require('./server-pad');
var Sms = require('./server-sms');
var Fs = require('fs');

// MAIN SERVER
var SERVER = new Engine.MainServer();

// CONTROLLER
var REMOTECTRL = new Remote.WebRemote(PORT_WS_TELECO, SERVER);

// PUBLISHER
var PUBLISHER = new Apps.Publisher(PORT_PUB, SERVER);

// TIME SERVER
var TIMESERVER = new Apps.TimeServer(PORT_TIME);

// LIVE PAD
var LIVEPAD = new Pad.PadServer(PORT_WS_PAD);

// SERVER TASKS PROCESSOR
SERVER.onConsume = function(task) {

  console.log('start consuming task');
  // clean up task
  if (task.who !== undefined) {channel = task.who; delete task.who; }
  if (task.localTime !== undefined) delete task.localTime;
  if (task.when !== undefined) delete task.when;

  // forge task request for Client
  task.group = 'all';
  task.timestamp = (new Date()).getTime();
  task.atTime = task.timestamp + PUB_DELAY; // Add transmission delay

  // PLAY something
  if (task.action == 'play') {

    // URL: convert .url files to actual url
    if (task.category == 'url')
    {
      // read file
      var url_content;
      try { url_content = Fs.readFileSync('../files/'+task.filename, 'utf8'); }
      catch (e) { console.log(e); return false;}

      // put actual url
      task.url = url_content;
    }

    // SMS: send sms using HighCoSms
    else if (task.category == 'sms')
    {
      // read file
      var sms_content;
      try { sms_content = Fs.readFileSync('../files/'+task.filename, 'utf8'); }
      catch (e) { console.log(e); return false;}

      // send sms
      var sms = new Sms.HighCoSms(sms_content);
      sms.addDest('0675471820');
      sms.send();
      console.log('did send sms..');
      return false;
    }

    // PAD: handle .live
    else if (task.category == 'text')
    {
      // read file
      var pad_content;
      try { pad_content = Fs.readFileSync('../files/'+task.filename, 'utf8'); }
      catch (e) { console.log(e); return false;}

      // set up PADSERVER
      LIVEPAD.loadText(pad_content);

      // send 'Reader Page' url to clients
      task.category = 'url';
      task.url = BASEURL+PADREADER;
    }

    // RAW CONTENT
    else task.url = BASEURL+'files/'+task.filename;

  }



  // publish
  console.log('finnished consuming task');
  return task;
};



//var ip = require( 'os' ).networkInterfaces( ).eth0[0].address;
console.log("Server Ready - REMOTE: "+PORT_WS_TELECO+" - PAD: "+PORT_WS_PAD+" - PUB: "+PORT_PUB+" - TIME: "+PORT_TIME);
