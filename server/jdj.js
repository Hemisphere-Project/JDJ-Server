
// CONFIG
var PORT_WS_APP = 8081;
var PORT_TIME = 8082;

var PORT_WS_USERS = 8087;
var PORT_WS_TELECO = 8088;
var PORT_WS_PAD = 8089;

var PUB_DELAY = 1998;  // Preemptive delay: ms

var BASEURL = 'http://app.journaldunseuljour.fr/';
var MEDIAURL = BASEURL+'files/';
var PADREADER = 'livepad/reader.html';

/*
VERSIONING
major: a new major version will prevent previous apps to run: they will exit immediatly
minor: a new minor version will invite previous apps to update: they will still run the show
*/
var VERSION = {'main': 0, 'major': 4, 'minor': 0};
var NEXTSHOW = (new Date()).getTime();

var BASEPATH = __dirname+'/';
var MEDIAPATH = BASEPATH+'../files/';

// LIBS
var Engine = require('./server-engine');
var Remote = require('./server-remote');
var Users = require('./server-users');
var Apps = require('./server-apps');
var Pad = require('./server-pad');
var Sms = require('./server-sms');
var Fs = require('fs');



// MAIN SERVER
var SERVER = new Engine.MainServer();

// CONTROLLERS
var REMOTECTRL = new Remote.WebRemote(PORT_WS_TELECO, SERVER);

// USERS / SHOW MANAGEMENT
var USERBASE = new Users.Userbase(BASEPATH+'db/dev.db');
var USERSCTRL = new Users.Userinterface(PORT_WS_USERS, USERBASE);

// APPS & TIME SERVERS
var APPSERVER = new Apps.AppServer(PORT_WS_APP, SERVER, VERSION, USERBASE, USERSCTRL);
var TIMESERVER = new Apps.TimeServer(PORT_TIME);

// LIVE PAD
var LIVEPAD = new Pad.PadServer(PORT_WS_PAD);

// SERVER TASKS PROCESSOR
SERVER.onConsume = function(task) {

  console.log('start consuming task ');
  //console.log(task);
  // clean up task
  if (task.localTime !== undefined) delete task.localTime;
  if (task.when !== undefined) delete task.when;

  // forge task request for Client
  // task.version = VERSION;
  //task.group = 'all';
  task.cache = true;
  task.timestamp = (new Date()).getTime();
  task.atTime = task.timestamp + PUB_DELAY; // Add transmission delay

  // PLAY something
  if (task.action == 'play') {

    // URL: convert .url files to actual url
    if (task.category == 'url')
    {
      // read file
      var url_content;
      try { url_content = Fs.readFileSync(MEDIAPATH+task.filename, 'utf8'); }
      catch (e) { console.log(e); return false;}

      // put actual url
      task.url = url_content;
      task.category = 'web';
    }

    // SMS: send sms using HighCoSms
    else if (task.category == 'sms')
    {
      // read file
      var sms_content;
      try { sms_content = Fs.readFileSync(MEDIAPATH+task.filename, 'utf8'); }
      catch (e) { console.log(e); return false;}

      // make sms
      var sms = new Sms.HighCoSms(sms_content);

      // get dests list
      var destinataires = USERBASE.getPhones(/*put event here*/);
      for (var i = 0; i < destinataires.length; i++) sms.addDest(destinataires[i]);

      sms.send();
      //console.log(destinataires);
      console.log('did send sms..');
      return false;
    }

    // PAD: handle .live
    else if (task.category == 'text')
    {
      // read file
      var text_content;
      try { text_content = Fs.readFileSync(MEDIAPATH+task.filename, 'utf8'); }
      catch (e) { console.log(e); return false;}

      // send 'Reader Page' url to clients
      task.content = text_content;
    }

    // PAD: handle .live
    else if (task.category == 'pad')
    {
      // read file
      var pad_content;
      try { pad_content = Fs.readFileSync(MEDIAPATH+task.filename, 'utf8'); }
      catch (e) { console.log(e); return false;}

      // set up PADSERVER
      LIVEPAD.loadText(pad_content);

      // send 'Reader Page' url to clients
      task.category = 'web';
      task.url = BASEURL+PADREADER;
    }

    // VIDEO: add HLS url
    else if (task.category == 'video')
    {
      try {
        var filebasename = task.filename.replace(/\.[^/.]+$/, "");
        var hlsflux = filebasename+'/'+filebasename+'.m3u8';
        Fs.statSync(MEDIAPATH+hlsflux);
        task.hls = MEDIAURL+hlsflux;
      } catch (e) { console.log('HLS flux NOT found: '+e); }

      task.url = MEDIAURL+task.filename;
    }

    // PHONE: convert into param 1
    else if (task.category == 'phone')
    {
      task.param1 = task.filename.replace(/\.[^/.]+$/, "");
      task.cache = false;
    }

    // RAW CONTENT
    else task.url = MEDIAURL+task.filename;

  }



  // publish
  console.log('finnished consuming task');
  return task;
};



//var ip = require( 'os' ).networkInterfaces( ).eth0[0].address;
console.log("\n");
console.log("Users/Shows Manager: "+PORT_WS_USERS);
console.log("Remote Control: "+PORT_WS_TELECO);
console.log("Livepad: "+PORT_WS_PAD);
console.log("App Com: "+PORT_WS_APP);
console.log("Time Sync: "+PORT_TIME);
console.log("\nServer READY!\n");
