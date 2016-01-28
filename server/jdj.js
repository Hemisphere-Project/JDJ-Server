
// CONFIG
var PORT_WS_APP = 8081;
var PORT_TIME = 8082;

var PORT_WS_USERS = 8087;
var PORT_WS_TELECO = 8088;
var PORT_WS_PAD = 8089;

var PUB_DELAY_VIDEO = 4000;  // Preemptive delay: ms
var PUB_DELAY_AUDIO = 1500;
var PUB_DELAY_WEB = 1500;
var PUB_DELAY_TXT = 500;

var BASEURL = 'http://app.journaldunseuljour.fr/';
var MEDIAURL = BASEURL+'files/';
var IMGREADER = BASEURL+'imager/show.php?img=';
var PADREADER = BASEURL+'livepad/reader.html';

var MULTITXT_SEPARATOR = '%%';

/*
VERSIONING
major: a new major version will prevent previous apps to run: they will exit immediatly
minor: a new minor version will invite previous apps to update: they will still run the show
*/
var VERSION = {'main': 0, 'major': 4, 'minor': 4};
var NEXTSHOW = (new Date()).getTime();

var BASEPATH = __dirname+'/';
var MEDIAPATH = BASEPATH+'../files/';

// LIBS
var _ = require('underscore');
var Engine = require('./server-engine');
var Remote = require('./server-remote');
var Users = require('./server-users');
var Apps = require('./server-apps');
var Pad = require('./server-pad');
var Sms = require('./server-sms');
var Fs = require('fs');


// TOOLS
// Read file content
function readFile (filename) {
  try { return Fs.readFileSync(MEDIAPATH+filename, 'utf8'); }
  catch (e) { console.log(e);}
  return null;
}

// Search HLS variant and return .m3u8 path
function addHLS (task) {
  try {
    var filebasename = task.filename.replace(/\.[^/.]+$/, "");
    var hlsflux = filebasename+'/'+filebasename+'.m3u8';
    Fs.statSync(MEDIAPATH+hlsflux);
    task.hls = MEDIAURL+hlsflux;
  } catch (e) { console.log('HLS flux NOT found: '+e); }
}




// MAIN SERVER
var SERVER = new Engine.MainServer();

// CONTROLLERS
var REMOTECTRL = new Remote.WebRemote(PORT_WS_TELECO, SERVER);

// USERS / SHOW MANAGEMENT
var USERBASE = new Users.Userbase(BASEPATH+'db/users_feur2.db', BASEPATH+'db/show_beta.db');
var USERSCTRL = new Users.Userinterface(PORT_WS_USERS, USERBASE);

// APPS & TIME SERVERS
var APPSERVER = new Apps.AppServer(PORT_WS_APP, SERVER, VERSION, USERBASE, USERSCTRL);
var TIMESERVER = new Apps.TimeServer(PORT_TIME);

// LIVE PAD
var LIVEPAD = new Pad.PadServer(PORT_WS_PAD);

// SERVER TASKS PROCESSOR
SERVER.onConsume = function(task) {

  console.log('executing task');
  //console.log(task);
  // clean up task
  if (task.localTime !== undefined) delete task.localTime;
  if (task.when !== undefined) delete task.when;

  // WHO TO GROUP & SECTION
  if (task.who == 'A' || task.who == 'B' || task.who == 'C') task.section = task.who;
  else if (task.who != 'all') task.group = task.who;

  task.url = MEDIAURL+task.filename; // deafault for raw content
  task.cache = true;
  task.timestamp = (new Date()).getTime();
  task.atTime = task.timestamp; // Add transmission delay

  // VIDEO: add HLS url
  if (task.category == 'video') {
    addHLS(task);
    task.atTime += PUB_DELAY_VIDEO;
  }

  if (task.category == 'audio') {
    task.atTime += PUB_DELAY_AUDIO;
  }

  // IMAGE: use web player
  if (task.category == 'image') {
    task.category = 'web';
    task.url = IMGREADER+task.filename;
    task.atTime += PUB_DELAY_WEB;
  }

  // PHONE: convert into param 1
  else if (task.category == 'phone') {
    task.param1 = task.filename.replace(/\.[^/.]+$/, "");
    task.cache = false;
  }

  // MEDIA based on file content
  else if (task.action == 'play') {

    // Get file content (exit if file not found)
    var filecontent = readFile(task.filename);
    if (filecontent == null) return false;

    // URL: convert .url files to actual url
    if (task.category == 'url') {
      task.category = 'web';
      task.url = filecontent;
      task.atTime += PUB_DELAY_WEB;
    }

    // PAD: handle .live
    else if (task.category == 'pad') {
      task.category = 'web';
      LIVEPAD.loadText(filecontent);
      task.url = PADREADER;
      task.atTime += PUB_DELAY_WEB;
    }

    // TEXT: send to app if available or send SMS
    else if (task.category == 'text') {
      task.content = Sms.splitMSG(filecontent, MULTITXT_SEPARATOR).join('@%%#');
      task.atTime += PUB_DELAY_TXT;
      // TODO: get non-smartphone clients and send SMS !
    }

    // SMS: send sms using HighCoSms
    else if (task.category == 'sms') {
      var sms = new Sms.HighCoSms(filecontent, MULTITXT_SEPARATOR);
      sms.sendTo( USERBASE.getPhones({group: task.group, section: task.section /*put event here*/ }) );
      return false;
    }
  }

  //console.log('finnished consuming task');
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
