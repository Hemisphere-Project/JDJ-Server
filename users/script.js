
$(function() {


  FastClick.attach(document.body);

  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                     EVENTS
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////


  allEvents = new Array();

  // fake DB
  // var event1={id:'1', place:'caracas', date: '18/32/7623', startH:'18', startM:'07' };
  // allEvents.push(event1);
  // var event2={id:'2',  place:'puno', date: '62/76/1563', startH:'17', startM:'24' };
  // allEvents.push(event2);
  // var event3={id:'3',  place:'buenos', date: '74/27/8273', startH:'19', startM:'32' };
  // allEvents.push(event3);


  buildEvents();

  function buildEvents(){
    $('#eventviewer').empty();
    $("#eventviewer").append(('<option value="all">all</option>'));
    $.each(allEvents,function(index,event){
      $("#eventviewer").append(('<option value_id="'+event.id+'" value="'+event.date+'">'+event.place+' - '+event.date+'</option>'));
    });
  }

  var dateselected;

  $('#eventviewer').change(function(){
    dateselected = $('#eventviewer option:selected').val();
    sortUsers();
    clearInputs();
    actuEventEditor();
    if (new_HIDDEN==false){
      $("#open_newEvent_Arrow").removeClass('fa-sort-asc').addClass('fa-sort-desc');
      $("#newEvent").slideUp(200, function(){ new_HIDDEN=true; });
    }
    //$('#editEvent').removeClass('eventModified');
  });

  function sortUsers(){
    $.each(allUsers,function(index,user){
      if (!user.event || user.event.date != dateselected){ user.userDiv.hide(); }
      else { user.userDiv.show(); }
      if (dateselected=='all') { user.userDiv.show(); }
    });
  }

  function actuEventEditor(){
    if (dateselected=='all') $('.editing').slideUp(200);
    else {
      $('.editing').slideDown(200);
      $.each(allEvents,function(index,event){
        if (dateselected == event.date){
          $('#editHour').val(event.startH);
          $('#editMin').val(event.startM);
          $('#editPlace').val(event.place);
          $('#editDate').val(event.date);
        }
      });
    }
  }

  $('#editHour, #editMin, #editPlace, #editDate').change(function(){
    $('#editEvent').addClass('eventModified');
  });

  $("#addEvent").on('click',function(){
    $("#addPlace,#addDate").css('color','black');
    var newdate = $('#addDate').val();
    var newplace = $('#addPlace').val();
    var starthour = $('#addHour').val();
    var startmin = $('#addMin').val();
    var regex = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/;
    var dateFormat = regex.test(newdate);
    if ((newplace!='lieu')&&(dateFormat)){
      var newevent = { place: newplace, date: newdate, startH:starthour, startM:startmin };
      socket.emit('newevent', newevent);
      console.log('NEW');
    }
    if (newplace=='lieu'){
      $("#addPlace").css('color','darkorange');
    }
    if (!dateFormat){
      $("#addDate").css('color','darkorange');
    }
  });

  $("#editEvent").on('click',function(){
    $.each(allEvents,function(index,event){
      if (dateselected == event.date){
        var regex = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/;
        var dateFormat = regex.test($('#editDate').val());
        if (dateFormat){
          var editedEvent = $.extend(true, {}, event);
          editedEvent.date = $('#editDate').val();
          editedEvent.place = $('#editPlace').val();
          editedEvent.startH = $('#editHour').val();
          editedEvent.startM = $('#editMin').val();
          socket.emit('editevent', editedEvent);
          console.log('EDIT');
        }
      }
    });
  });

  $("#deleteEvent").on('click',function(){
    if (dateselected != 'all'){
      $.each(allEvents,function(index,event){
        if (dateselected == event.date)
          socket.emit('removeevent', event);
          console.log('DELETE');
      });
    }
  });

  function clearInputs(){

    $('#addHour').val('18');
    $('#addMin').val('00');
    $('#addPlace').val('lieu');
    $('#addDate').val('jj/mm/aaaa');
    $("#open_newEvent_Arrow").removeClass('fa-sort-asc').addClass('fa-sort-desc');
    $("#newEvent").slideUp(200, function(){ new_HIDDEN=true;});

    $('#editHour').val('18');
    $('#editMin').val('00');
    $('#editPlace').val('lieu');
    $('#editDate').val('jj/mm/aaaa');
    $('#editEvent').removeClass('eventModified');
    //$("#open_editEvent_Arrow").removeClass('fa-sort-asc').addClass('fa-sort-desc');
    //$("#editEvent").slideUp(200, function(){ edit_HIDDEN=true;});

  }

  function gotoEvent(date){
    buildEvents();
    buildUserEvents();
    $('#eventviewer').val(date).change();
  }

  function buildUserEvents(){
    $.each(allUsers, function(index,user){
      //REBUILD
      user.eventpicker.empty();
      $.each(allEvents,function(index,event){
        user.eventpicker.append(('<option value="'+event.date+'">'+event.place+' - '+event.date+'</option>'));
      });
      //RESELECT
      if (user.event) user.eventpicker.val(user.event.date);
      else user.warning();
    });
  }

  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                     NAVIG
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  $("#newEvent").hide();
  var new_HIDDEN=true;

  $("#open_newEvent").click(function(){
    toggleNewEvent();
  });

  function toggleNewEvent(){
    if (new_HIDDEN==true){
      $("#open_newEvent_Arrow").removeClass('fa-sort-desc').addClass('fa-sort-asc');
      $("#newEvent").slideDown(200, function(){ new_HIDDEN=false;});
    }
    if (new_HIDDEN==false){
      $("#open_newEvent_Arrow").removeClass('fa-sort-asc').addClass('fa-sort-desc');
      $("#newEvent").slideUp(200, function(){new_HIDDEN=true;});
    }
  };




  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                     USERS
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////


  allUsers = new Array();
  userPool = new user_pool();

  // Fake_DB
  // var user1={
  //   active: true,
  //   id: 'alphatesteur',
  //   number: '0673645293',
  //   event: {place: 'caracas',date:'18/32/7623'},
  //   os: 'ios',
  //   group: 'group1',
  //   section: {A:false,B:false,C:true},
  //   force: true
  // }
  // userPool.addUser(user1);
  // var user2={
  //   active: false,
  //   id: 'betatesteur',
  //   number: '0653674843',
  //   event: {place:'puno', date: '62/76/1563'},
  //   os: 'android',
  //   group: 'group2',
  //   section: {A:false,B:true,C:false},
  //   force: true
  // }
  // userPool.addUser(user2);
  // var user3={
  //   active: true,
  //   id: 'gammatesteur',
  //   number: '0635426354',
  //   event:{place:'buenos', date: '74/27/8273'},
  //   os: 'android',
  //   group: 'group2',
  //   section: {A:true,B:true,C:false},
  //   force: false
  // }
  // userPool.addUser(user3);
  // var user4={
  //   active: true,
  //   id: 'omegatesteur',
  //   number: '0763547351',
  //   event:{place:'buenos', date: '74/27/8273'},
  //   os: 'ios',
  //   group: 'group1',
  //   section: {A:true,B:true,C:true},
  //   force: true
  // }
  // userPool.addUser(user4);


  function user_pool(){

    this.addUser = function(userarray){
        allUsers.push(new user(userarray));
    }

    this.clearUsers = function(){
      allUsers = [];
      $("#users").empty();
    }

  }


  function user(userarray){

    this.active = userarray.active;
    this.id = userarray.id;
    this.number = userarray.number;
    this.event = userarray.event;
    this.os = userarray.os;
    this.group = userarray.group;
    this.section = userarray.section;
    this.force = userarray.force;

    var thisuser = this;

    // BUILD DIVS
    this.userDiv = $('<div>').attr('id', this.id).addClass('user').appendTo( $('#users') );
    // active
    this.activeDiv = $('<div>').addClass('user_field col_actif').appendTo(this.userDiv);
    this.activeView = $('<i>').addClass('fa fa-circle inactive').appendTo(this.activeDiv);
    // id
    this.idView = $('<div>').addClass('user_field col_name').appendTo(this.userDiv);
    // number
    this.numberView = $('<div>').addClass('user_field col_num').appendTo(this.userDiv);
    // event
    this.eventDiv = $('<div>').addClass('user_field col_event').appendTo(this.userDiv);
    this.eventpicker = $('<select>').addClass('dropdown small').appendTo(this.eventDiv);
    $.each(allEvents,function(index,event){
      thisuser.eventpicker.append(('<option value="'+event.date+'">'+event.place+' - '+event.date+'</option>'));
    });
    // os
    this.osView = $('<div>').addClass('user_field col_os').appendTo(this.userDiv);
    // group
    this.groupView = $('<div>').addClass('user_field col_group').appendTo(this.userDiv);
    // section
    this.sectionDiv = $('<div>').addClass('user_field col_section').appendTo(this.userDiv);
    this.sectionA = $('<input>').attr({type: 'checkbox', id: this.id+'A'}).appendTo(this.sectionDiv);
    this.sectionA.after($("<label>").attr("for", this.sectionA.attr("id")) );
    this.sectionB = $('<input>').attr({type: 'checkbox', id: this.id+'B'}).appendTo(this.sectionDiv);
    this.sectionB.after($("<label>").attr("for", this.sectionB.attr("id")) );
    this.sectionC = $('<input>').attr({type: 'checkbox', id: this.id+'C'}).appendTo(this.sectionDiv);
    this.sectionC.after($("<label>").attr("for", this.sectionC.attr("id")) );
    // force
    this.forceDiv = $('<div>').addClass('user_field col_force').appendTo(this.userDiv);
    this.forcebox = $('<input>').attr({type: 'checkbox', id: this.id+'_force'}).appendTo(this.forceDiv);
    this.forcebox.after($("<label>").attr("for", this.forcebox.attr("id")) );
    // saveText
    this.saveDiv = $('<div>').addClass('user_field uibutton col_save').appendTo(this.userDiv);
    this.saveButton = $('<i>').addClass('fa fa-floppy-o').appendTo(this.saveDiv);
    // remove
    this.deleteDiv = $('<div>').addClass('user_field uibutton col_delete').appendTo(this.userDiv);
    this.deleteButton = $('<i>').addClass('fa fa-trash-o').appendTo(this.deleteDiv);


    // INIT VISUS
    //console.log(thisuser.event);
    if (this.active == true){this.activeView.removeClass('inactive').addClass('active'); }
    this.idView.html(this.id);
    this.numberView.html(this.number);
    if (thisuser.event) this.eventpicker.val(thisuser.event.date);
    this.osView.html(this.os);
    this.groupView.html(this.group);
    this.sectionA.prop( "checked", this.section['A'] );
    this.sectionB.prop( "checked", this.section['B'] );
    this.sectionC.prop( "checked", this.section['C'] );
    this.forcebox.prop( "checked", this.force);

    this.warning = function() {
      thisuser.userDiv.css('background-color', 'orange'); 
    }

    // INTERACT VISUS
    this.eventpicker.change(function(){
      thisuser.event.date = $(this).find('option:selected').val();
      $.each(allEvents,function(index,event){
        if (thisuser.event.date == event.date){ thisuser.event.place = event.place; }
      });
      thisuser.saveButton.addClass("userModified");
      thisuser.saveButton.click();  //autosave
    });
    this.sectionA.change(function(){
      thisuser.section['A'] = $(this).prop('checked');
      thisuser.saveButton.addClass("userModified");
      thisuser.saveButton.click();  //autosave
    });
    this.sectionB.change(function(){
      thisuser.section['B'] = $(this).prop('checked');
      thisuser.saveButton.addClass("userModified");
      thisuser.saveButton.click();  //autosave
    });
    this.sectionC.change(function(){
      thisuser.section['C'] = $(this).prop('checked');
      thisuser.saveButton.addClass("userModified");
      thisuser.saveButton.click();  //autosave
    });
    this.forcebox.change(function(){
      thisuser.force = $(this).prop('checked');
      thisuser.saveButton.addClass("userModified");
      thisuser.saveButton.click();  //autosave
    });


    // SAVE
    this.saveButton.on('click',function(){
      // SEND OBJECT
      console.log('saving '+thisuser.id+'... waiting for server response');
      var editedUser = {
        active: thisuser.active,
        id: thisuser.id,
        number: thisuser.number,
        event: thisuser.event,
        os: thisuser.os,
        group: thisuser.group,
        section: thisuser.section,
        force: thisuser.force
      };
      socket.emit('editeduser', editedUser);

    });

    // UPDATE active
    this.updateActive = function(isActive) {
      this.activeView.toggleClass('inactive', !isActive).toggleClass('active', isActive);
      this.active = isActive;
    }

    this.deleteButton.on('click',function(){
      console.log('removing '+thisuser.id+'... waiting for server response');
      if (confirm('Supprimer '+thisuser.number+' ?')) socket.emit('deleteuser', thisuser.id);
    });

    this.updateDelete = function(id){
      console.log('removing '+id);
    }


  }
  // End User object


  $('#debug').on('click',function(){


  });



  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                     SOCKET
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  var IO_PORT = 8087;
  url = 'http://'+document.location.hostname+':'+IO_PORT;
  var socket = io(url);

  socket.on('connect', function () {
    console.log('Connected to Server: '+url);
  });

  socket.on('alldata', function(data) {
    // console.log(data);
    // events
    console.log(data.events);
    allEvents = data.events;
    // users
    userPool.clearUsers();
    $.each(data.users,function(index,user){
      userPool.addUser(user);
    });
    // load view
    gotoEvent('all');
  });

  socket.on('createdevent', function(event) {
    if (event) allEvents.push(event);
    gotoEvent(event.date);
  });

  socket.on('updatedevent', function (editedEvent) {
    if (editedEvent)
      $.each(allEvents,function(index,ev){
        if (ev.id == editedEvent.id) {
          ev.date = editedEvent.date;
          ev.place = editedEvent.place;
          ev.startH = editedEvent.startH;
          ev.startM = editedEvent.startM;
        }
      });
    gotoEvent(editedEvent.date);
  });

  socket.on('deletedevent', function(deletedEvent) {
    if (deletedEvent){
      var indextoremove = null;
      $.each(allEvents,function(index,ev){
          if (ev.id == deletedEvent.id) indextoremove = index });
      allEvents.splice(indextoremove,1);
    }
    gotoEvent('all');
  });

  socket.on('updateduser', function (userid) {
    $.each(allUsers,function(index,user){
      if (userid == user.id ){ console.log('updated user '+ user.id); user.saveButton.removeClass("userModified"); }
    });
  });

  socket.on('stateuser', function (state) {
    $.each(allUsers, function(index,user){
      if (state.id == user.id ) user.updateActive(state.state);
    });
  });

  socket.on('deleteduser', function (userdeleted) {
    var indextoremove;
    $.each(allUsers, function(index,user){
      if (userdeleted.id == user.id ) {
        user.userDiv.remove();
        indextoremove = index;
        console.log('deleted user '+user.id);
      }
    });
    allUsers.splice(indextoremove,1);
  });

  socket.on('newuser', function (newuser) {
    var addUser = true;
    $.each(allUsers, function(index,user){
      if (user.id==newuser.id ){ addUser = false; }
    });
    if (addUser==true){ userPool.addUser(newuser); }
  });

  $('#debug').on('click',function(){
  });



});
