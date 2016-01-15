var fs = require('fs');
var _ = require('underscore');
var SocketIO = require('socket.io');

//var PNF = require('google-libphonenumber').PhoneNumberFormat;
//var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

function sqlDate(input) {
  var parts = input.split('/');
  return parts[2]+'-'+parts[1]+'-'+parts[0];
}
function showDate(input) {
  var parts = input.split('-');
  return parts[2]+'-'+parts[1]+'-'+parts[0];
}


module.exports = {

  Userbase: function (basepath) {
    var that = this;

    // Save DB to disk
    this.save = function() {
      fs.writeFileSync(this.basepath, JSON.stringify(this.db));
    }

    // Create/Load DB
    this.basepath = basepath;
    try { this.db = JSON.parse(fs.readFileSync(this.basepath)); }
    catch (e) {
      this.db = {users: [], events:[]};
      if (e.code === 'ENOENT') this.save();
      else throw e;
    }

    // Get Complete Database
    this.getAll = function() {
      // Clear NULL entries
      var base = JSON.parse(JSON.stringify(this.db));
      base.events = _.without(base.events, null);
      base.users = _.without(base.users, null);
      return base;
    }

    // Get All Users
    this.getAllUsers = function() {
      return this.getAll().users;
    }

    // Get All Users
    this.getAllEvents = function() {
      return this.getAll().events;
    }

    // Clean user pattern
    this.User = function() {
      return {
        id: null,
        number: null,
        event: null, //{place: 'caracas',date:'18/32/7623'},
        os: '',
        group: '', //group1
        section: {A:false,B:false,C:false},
        force: false,
        active: true
        //connected: false
      }
    }

    // Clean date pattern
    this.Event = function() {
      return {
        place: '',
        date: null
      }
    }

    // Get user
    this.getUser = function(userid) {
      if (this.existUser(userid)) return this.db.users[userid];
      else return this.User();
    }

    // Get user by Phone number
    this.getUserByNumber = function(phone) {
      var user = this.User();
      _.each(this.db.users, function(el, index) {
        if (phone != '' && el.number == phone) user = el;
      });
      return user;
    }

    // Get user
    this.existUser = function(userid) {
      return userid !== null && userid >= 0 && (userid in this.db.users) && (this.db.users[userid] !== null);
    }

    // Validate User info
    this.errorUser = function(user) {
      // TODO: Validate user information (phone / show, etc..)
      var error = null;
      if (user.number != '')
        if (user.number.length != 10)
          error = 'Le numéro de téléphone doit comporter 10 chiffres.\nLaissez le champ vide si vous ne souhaitez pas recevoir de SMS.';

      if (user.event == null)
        error = 'Merci de choisir la représentation\nà laquelle vous souhaitez assister !';

      //if (error == null) error = 'yo';

      return error;
    }

    // Add user
    this.saveUser = function(user, allowError) {
      user.error = this.errorUser(user);
      if (allowError === undefined) allowError = true;
      if (allowError || user.error == null) {
        if (user.id === null || user.id < 0) user.id = this.db.users.length;
        this.db.users[user.id] = user;
        this.save();
      }
      return user;
    }

    // Update user
    this.updateUser = function(user) {
      if (this.existUser(user.id)) {
        return this.saveUser(user);
      }
      else return null;
    }

    // Remove user
    this.removeUser = function(userid) {
      if (this.existUser(userid)) {
        this.db.users[userid] = null;
        this.save();
      }
    }

    // update user connection state
    this.userState = function(userid, isConnected) {
      var user = this.getUser(userid);
      user.active = isConnected; 
      this.updateUser(user);
    }

    // Get Show by ID
    this.getShowById = function(showid) {
      if (this.existShowId(showid)) return this.db.events[showid];
      else return null;
    }

    this.existShowId = function(showid) {
      return showid !== null && (showid in this.db.events) && (this.db.events[showid] !== null);
    }

    this.getShowByDate = function(date) {
      var show = null;
      _.each(this.db.events, function(el, index) {
        if (el.date == date) {show = el; show.id = index;}
      });
      return show;
    }

    // Exist Show
    this.existShowDate = function(date) {
      var exist = false;
      _.each(this.db.events, function(el) {
        if (el != null) 
          if (el.date == date) exist = true;
      });
      return exist;
    }

    // Add Show
    this.saveShow = function(show) {
      if (show.id === null) show.id = this.db.events.length;
      this.db.events[show.id] = show;
      this.save();
      return show;
    }

    // Update Show
    this.updateShow = function(show) {
      if (this.existShowDate(show.date)) {
        var showold = this.getShowByDate(show.date);
        show.id = showold.id;
        return this.saveShow(show);
      }
      else return null;
    }

    // Remove Show
    this.removeShowByDate = function(date) {
      if (this.existShowDate(date)) {
          var show = this.getShowByDate(date);
          this.db.events[show.id] = null;
          this.save();
      }
    }

  },

  Userinterface: function(port, base) {
    var that = this;

    // users base
    this.showbase = base;

    // SocketIO websocket
    this.socket = new SocketIO();
    this.socket.listen(port);

    // NEW Remote interface connected
    this.socket.on('connection', function(client){

      // EDIT User event
      client.on('editeduser', function(data){
        var uu = that.showbase.updateUser(data);
        if (uu != null) client.emit('updateduser', uu.id);
      });

      // ADD Date event
      client.on('newevent', function(data){
          data.id = null;
          that.showbase.saveShow(data);
      });

      // DELETE Date event
      client.on('removedate', function(data){
          that.showbase.removeShowByDate(data);
      });

      client.emit('alldata', that.showbase.getAll());

    });

    this.socket.on('error', function(err) {
        console.log('Socket.io Error: '+err);
    });

    // Emit shortcut
    this.send = function(subject, data) {
      this.socket.emit(subject, data);
    };

  }

}
