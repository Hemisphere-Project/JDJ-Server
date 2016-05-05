var fs = require('fs');
var _ = require('underscore');
var SocketIO = require('socket.io');
var dnode = require('dnode');

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

  Userbase: function (basepath, userdb, showdb, statedb) {
    var that = this;

    this.userbasepath = basepath+userdb;
    this.showbasepath = basepath+showdb;
    this.statebasepath = basepath+statedb;

    // Save DB to disk
    this.save = function() {
      fs.writeFileSync(this.userbasepath, JSON.stringify(this.db.users));
      fs.writeFileSync(this.showbasepath, JSON.stringify(this.db.events));
    }

    // Create/Load DB
    var doSave = false;
    this.db = {users: [], events:[]};
    try { this.db.users = JSON.parse(fs.readFileSync(this.userbasepath)); }
    catch (e) {
      this.db.users = [];
      if (e.code === 'ENOENT') doSave = true;
      else throw e;
    }
    try { this.db.events = JSON.parse(fs.readFileSync(this.showbasepath)); }
    catch (e) {
      this.db.events = [];
      if (e.code === 'ENOENT') doSave = true;
      else throw e;
    }
    if (doSave) this.save();

    // Get Complete Database
    this.getAll = function() {
      // Clear NULL entries
      var base = JSON.parse(JSON.stringify(this.db));
      base.events = _.without(base.events, null);
      base.users = _.without(base.users, null);
      return base;
    }

    this.isObject = function(obj) {
      return obj === Object(obj) && Object.prototype.toString.call(obj) !== '[object Array]';
    }

    this.compare = function(val1, val2) {
      var tester; var tested;
      if (this.isObject(val2) && !this.isObject(val1)) {tester = val1; tested=val2;}
      else {tester = val2; tested=val1;}

      // both objects, we check each properties
      if (this.isObject(tester)) {
        for (var prop in tester)
          if (!this.compare(tested[prop], tester[prop])) return false;
        return true;
      }
      else {
        // tested is object, check if property corresponding to tester value is explicitly true
        if (this.isObject(tested)) return tested[tester] == true;
        // neither are object => direct comparaison
        else return tested == tester;
      }
    }

    this.filter = function(array, params) {
      if (params === undefined || params == null) return array;
      var filteredArray = [];

      for (var k = 0; k < array.length; k++) // each item in the array
      {
        var add = true;
        for (var prop in params)  //each prop of conditions object
          if (_.has(array[k], prop)) // check if item has this property (if not ignore this condition)
            if (params[prop] !== undefined) // if condition is not undefined
              add = add && this.compare(array[k][prop], params[prop]); // check condition
              //console.log('tested '+prop+'='+params[prop]+' on item '+k+'='+array[k][prop]+' / result is '+add);
        if (add) filteredArray.push(array[k]);
      }
      return filteredArray;
    }

    // Get All Users
    this.getUsers = function(params) {
      return this.filter(this.getAll().users, params);
    }

    // Get All Users
    this.getEvents = function(params) {
      return this.filter(this.getAll().events, params);
    }

    // Update Users active state to off
    _.each(this.getUsers(), function(el, index) {
      el.active = false;
    });
    this.save();

    // Clean user pattern
    this.User = function() {
      return {
        id: null,
        number: null,
        event: null, //{place: 'caracas',date:'18/32/7623'},
        os: '',
        plateform: '',
        group: null, //group1
        section: {A:false,B:false,C:false},
        force: false,
        active: false
        //connected: false
      }
    }

    // Clean date pattern
    this.Event = function() {
      return {
        id: null,
        place: '',
        date: null,
        startH: null,
        startM: null
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
        if (el)
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
      if (user.number)
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
      if (user.id === null || user.id < 0) user.id = this.db.users.length;

      if (user.os.lastIndexOf('ios', 0) === 0) user.plateform = 'ios';
      else if (user.os.lastIndexOf('android', 0) === 0) user.plateform = 'android';
      else user.plateform = '';

      this.db.users[user.id] = user;
      this.save();

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

    // get all phone for given event
    this.getPhones = function(params, plateform) {
      var phones = [];
      if (plateform !== undefined) params['plateform'] = plateform;
      var users = this.getUsers(params);
      _.each(users, function(el) { phones.push(el.number) });
      phones = _.without(phones, null, '');
      phones = _.uniq(phones);
      return phones;
    }

    // choose a group for new users
    this.chooseGroup = function(grps, params) {
      var count = {};
      _.each(grps, function(el) { count[el] = 0 });
      _.each(this.getUsers(params), function(el) { if (_.contains(grps,el.group)) count[el.group]++; });
      var lower = grps[0];
      _.each(count, function(n, g) { if (count[lower] > n) lower = g; });
      return lower;
    }

    //
    // EVENTS
    //

    this.updateStateDB = function(repeat) {
      var state = 'off'; // 'pre', 'time', 'after' ou 'all'
      var show = that.getCurrentEvent();
      if (show) state = show.state;
      fs.writeFileSync(this.statebasepath, state);

      if (repeat) {
        var r_time = 1000*60*10; //10min
        if (state != 'off') r_time = 1000*60*1; //1min
        setTimeout(function(){ that.updateStateDB(true) }, r_time);
      }
    }

    // Get current event
    this.getCurrentEvent = function() {
      var show = null;
      _.each(that.getEvents(), function(el, index) {
        that.setShowState(el);
        if (el.state != 'off') show = el;
      });
      return show;
    }

    // Set show state
    this.setShowState = function(show) {
      var now = (new Date()).getTime();
      var dd = show.date.split('/');
      var start = new Date(dd[2], dd[1]-1, dd[0], show.startH, show.startM);
      var before = new Date(start); before.setDate(before.getDate() - 1); // start - 1j
      var end = new Date(start); end.setDate(end.getDate() + 1); // start + 1j
      var after = new Date(end); after.setDate(after.getDate() + 1); // end + 1j
      var sustain = new Date(after); sustain.setDate(sustain.getDate() + 2); // after + 2j

      show.state = 'off';
      if (now >= before.getTime() && now <= sustain.getTime()) {
        if (now < start.getTime()) show.state = 'pre';
        else if (now < end.getTime()) show.state = 'time';
        else if (now < after.getTime()) show.state = 'after';
        else show.state = 'all';
      }
    }

    // Get Show by ID
    this.getShowById = function(showid) {
      if (this.existShowId(showid)) return this.db.events[showid];
      else return null;
    }

    this.existShowId = function(showid) {
      return showid !== null && showid >= 0 && (showid in this.db.events) && (this.db.events[showid] !== null);
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
      if (show === null) return null;
      if (show.id === null) show.id = this.db.events.length;
      this.db.events[show.id] = show;
      this.save();
      return show;
    }

    // Update Show
    this.updateShow = function(show) {
      if (this.existShowId(show.id)) return this.saveShow(show);
      else return null;
    }

    // Remove Show
    this.removeShow = function(show) {
      if (this.existShowId(show.id)) {
          this.db.events[show.id] = null;
          this.save();
      }
    }

  },

  Userinterface: function(port_ws, port_php, server) {
    var that = this;

    // users base
    this.server = server;
    this.showbase = server.USERBASE;

    // SocketIO websocket
    this.socket = new SocketIO();
    this.socket.listen(port_ws);

    // PHP Dnode service
    var server = dnode({
        allEvents : function (s, cb) {
            cb(that.showbase.getEvents())
        },
        addUser : function (s, cb) {
            var newuser = that.showbase.getUserByNumber(s.phone);

            // update data
            newuser.number = s.phone;
            newuser.event = that.showbase.getShowById(s.eventid);
            if (newuser.group == null)
              newuser.group = that.showbase.chooseGroup(['group1', 'group2']);

            // check if valid, and save
            //console.log('add user: ',newuser);
            that.showbase.saveUser(newuser);
            cb();
        },
    });
    server.listen(port_php);


    // NEW Remote interface connected
    this.socket.on('connection', function(client){

      // EDIT User event
      client.on('editeduser', function(data){
        var uu = that.showbase.updateUser(data);
        if (uu != null) client.emit('updateduser', uu.id);
        that.server.onUserUpdated(uu);
      });

      // DELETE User event
      client.on('deleteuser', function(data){
        var uu = that.showbase.getUser(data);
        that.showbase.removeUser(data);
        if (uu != null) client.emit('deleteduser', uu);
      });

      // ADD Date event
      client.on('newevent', function(data){
          data.id = null;
          var show = that.showbase.saveShow(data);
          client.emit('createdevent', show);
          that.server.onShowsUpdated();
      });

      // EDIT Date event
      client.on('editevent', function(data){
          var show = that.showbase.saveShow(data);
          client.emit('updatedevent', show);
          that.server.onShowsUpdated();
      });

      // DELETE Date event
      client.on('removeevent', function(data){
          that.showbase.removeShow(data);
          client.emit('deletedevent', data);
          that.server.onShowsUpdated();
      });

      client.emit('alldata', that.showbase.getAll());
      //console.log(that.showbase.getAll());

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
