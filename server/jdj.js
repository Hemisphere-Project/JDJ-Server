
// CONFIG
var PORT_WS_TELECO = 8088;
var PORT_WS_PAD = 8089;
var PORT_WS_CLIENT = 8090;
var PORT_PUB = 8081;
var PORT_TIME = 8082;

var PUB_DELAY = 1998;

var BASEURL = 'http://app.journaldunseuljour.fr/';
var MEDIAURL = BASEURL+'files/';
var PADREADER = 'livetext/reader.html';

/*
VERSIONING
major: a new major version will prevent previous apps to run: they will exit immediatly
minor: a new minor version will invite previous apps to update: they will still run the show
*/
var VERSION = {'major': 0, 'minor': 3};
var NEXTSHOW = (new Date(2015, 11, 09)).getTime();

var BASEPATH = __dirname+'/';
var MEDIAPATH = BASEPATH+'../files/';

// LIBS
var Engine = require('./server-engine');
var Remote = require('./server-remote');
var Apps = require('./server-apps');
var Pad = require('./server-pad');
var Sms = require('./server-sms');
var Fs = require('fs');
var Sqlite3 = require("sqlite3").verbose();

// DATABASE
var databasename = "database.db";
var DATABASE = new Sqlite3.Database(databasename);
DATABASE.serialize(function() {
  if(!Fs.existsSync(databasename)) {
    db.run("CREATE TABLE Dates ( \
                                      dateid INTEGER PRIMARY KEY, \
                                      date TEXT, \
                                      )");
    db.run("CREATE TABLE Users ( \
                                      userid INTEGER PRIMARY KEY, \
                                      phone TEXT, \
                                      ostype TEXT, \
                                      dateid INTEGER, \
                                      group INTEGER, \
                                      optionA INTEGER, \
                                      optionB INTEGER, \
                                      optionC INTEGER \
                                      enable INTEGER, \
                                      lastcon INTEGER, \
                                      FOREIGN KEY(dateid) REFERENCES Dates(dateid) \
                                      )");
  }

});

// MAIN SERVER
var SERVER = new Engine.MainServer();

// CONTROLLER
var REMOTECTRL = new Remote.WebRemote(PORT_WS_TELECO, SERVER);

// PUBLISHER
var PUBLISHER = new Apps.Publisher(PORT_PUB, SERVER);

// APPS WS
var INFOCLIENT = new Apps.Info(PORT_WS_CLIENT, SERVER, PUBLISHER, VERSION, NEXTSHOW);

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
  // task.version = VERSION;
  task.group = 'all';
  task.cache = true;
  //task.timestamp = (new Date()).getTime();  // DISABLED: it doesn't work properly
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
console.log("Server Ready - REMOTE: "+PORT_WS_TELECO+" - PAD: "+PORT_WS_PAD+" - PUB: "+PORT_PUB+" - TIME: "+PORT_TIME);
