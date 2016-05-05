
// CONFIG
var PORT_PROXY = 444;
var PORT_WS_APP_HTTPS = 8081;
var PORT_WS_APP_HTTP = 8083;
var PORT_TIME = 8082;

var PORT_DNODE_PHP = 8086;
var PORT_WS_USERS = 8087;
var PORT_WS_TELECO = 8088;
var PORT_WS_PAD = 8089;

var PUB_DELAY_VIDEO = 3000;  // Preemptive delay: ms
var PUB_DELAY_AUDIO = 3000;
var PUB_DELAY_WEB = 1000;
var PUB_DELAY_TXT = 500;
var PUB_DELAY_DEFAULT = 200;

var BASEURL = 'https://app.journaldunseuljour.fr:'+PORT_PROXY+'/';
var MEDIAURL = BASEURL+'files/';
var IMGREADER = BASEURL+'imager/show.php?img=';
var PADREADER = BASEURL+'livepad/reader2.html';

var MULTITXT_SEPARATOR = '%%';

/*
VERSIONING
major: a new major version will prevent previous apps to run: they will exit immediatly
minor: a new minor version will invite previous apps to update: they will still run the show
*/
var VERSION = {'main': 1, 'major': 0, 'minor': 0, 'android-minor': 13, 'ios-minor': 4};
var NEXTSHOW = (new Date()).getTime();
2
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
  var filebasename = task.filename.replace(/\.[^/.]+$/, "");
  var url = filebasename+'/'+filebasename;
  try {
    Fs.statSync(MEDIAPATH+url+'.m3u8');
    task.hls = MEDIAURL+url+'.m3u8';
    console.log('HLS found: '+task.hls);
  } catch (e) { console.log('HLS flux NOT found: '+e); }
  try {
    Fs.statSync(MEDIAPATH+url+'.mp4');
    task.url = MEDIAURL+url+'.mp4';
    console.log('UGLY found: '+task.filename);
  } catch (e) { console.log('UGLY file NOT found: '+e); }
}




// MAIN SERVER
var SERVER = new Engine.MainServer(VERSION);

// USERS / SHOW MANAGEMENT
SERVER.USERBASE = new Users.Userbase(BASEPATH+'db/', 'users_frappaz.db', 'show_frappaz.db', 'event_state.db');
SERVER.USERSCTRL = new Users.Userinterface(PORT_WS_USERS, PORT_DNODE_PHP, SERVER);
SERVER.USERBASE.updateStateDB(true);

// CONTROLLERS
SERVER.REMOTECTRL = new Remote.WebRemote(PORT_WS_TELECO, SERVER);

// APPS & TIME SERVERS
SERVER.APPSERVER = new Apps.AppServer(PORT_WS_APP_HTTPS, PORT_WS_APP_HTTP, SERVER);
SERVER.TIMESERVER = new Apps.TimeServer(PORT_TIME);

// LIVE PAD
SERVER.LIVEPAD = new Pad.PadServer(PORT_WS_PAD);

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

  else if (task.category == 'audio') {
    task.atTime += PUB_DELAY_AUDIO;
  }

  // IMAGE: use web player
  else if (task.category == 'image') {
    task.category = 'web';
    task.url = IMGREADER+task.filename;
    task.atTime += PUB_DELAY_WEB;
  }

  // PHONE: convert into param 1
  else if (task.category == 'phone') {
    task.param1 = task.filename.replace(/\.[^/.]+$/, "")+"";
    if (task.param1.indexOf("light") === 0) task.cache = true;
    else task.cache = false;
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
      SERVER.LIVEPAD.loadText(filecontent);
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

      var filter = {group: task.group, section: task.section};
      if (task.eventid >= 0) filter['event'] = SERVER.USERBASE.getShowById(task.eventid);

      sms.sendTo( SERVER.USERBASE.getPhones(filter, 'android'), 'android' );
      sms.sendTo( SERVER.USERBASE.getPhones(filter, 'ios'), 'ios' );
      sms.sendTo( SERVER.USERBASE.getPhones(filter, '') );


      //sms.sendTo( SERVER.USERBASE.getPhones({group: task.group, section: task.section, event:event, plateform:'' }), 'none' );
      //sms.sendTo( SERVER.USERBASE.getPhones(), 'android' );
      //sms.sendTo( SERVER.USERBASE.getPhones({group: task.group, section: task.section, event:event, plateform:'ios' }), 'ios' );

      return false;
    }
  }
  else task.atTime += PUB_DELAY_DEFAULT;

  //console.log('finnished consuming task');
  //console.log(task);
  return task;
};



//var ip = require( 'os' ).networkInterfaces( ).eth0[0].address;
console.log("\n");
console.log("Users/Shows Manager: "+PORT_WS_USERS);
console.log("Remote Control: "+PORT_WS_TELECO);
console.log("Livepad: "+PORT_WS_PAD);
console.log("App Com: "+PORT_WS_APP_HTTPS+"/"+PORT_WS_APP_HTTP);
console.log("Time Sync: "+PORT_TIME);
console.log("\nServer READY!\n");
