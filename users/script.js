
$(function() {


  FastClick.attach(document.body);

  var dates=["19/36/1897","20/46/1897","49/36/1897","19/36/4397","43/85/1897","74/56/1783","94/94/1873","73/43/5432","94/43/6374","11/11/1111"];
  $.each(dates,function(index,date){
    $("#dateviewer").append(('<option value="'+date+'">'+date+'</option>'));
  });

  $('#dateviewer').change(function(){
    var dateselected = $('#dateviewer option:selected').val();
    sortUsers(dateselected);
  });

  function sortUsers(dateSelect){
    $.each(allUsers,function(index,user){
      console.log(user.date);
      if (user.date != dateSelect){ user.userDiv.hide(); }
      else { user.userDiv.show(); }
    })
  }


  allUsers = new Array();
  userPool = new user_pool();

  function user_pool(){
    this.addUser = function(userarray){
        allUsers.push(new user(userarray));
    }
  }

  function user(userarray){

    this.active = userarray.active;
    this.id = userarray.id;
    this.number = userarray.number;
    this.date = userarray.date;
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
    // date
    this.dateDiv = $('<div>').addClass('user_field col_date').appendTo(this.userDiv);
    this.datepicker = $('<select>').addClass('dropdown small').appendTo(this.dateDiv);
    $.each(dates,function(index,date){
      thisuser.datepicker.append(('<option value="'+date+'">'+date+'</option>'));
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
    this.saveDiv = $('<div>').addClass('user_field col_save').appendTo(this.userDiv);
    this.saveButton = $('<i>').addClass('fa fa-floppy-o').appendTo(this.saveDiv);


    // ACTU VISUS
    if (this.active == true){this.activeView.removeClass('inactive').addClass('active'); }
    this.idView.html(this.id);
    this.numberView.html(this.number);
    this.datepicker.val(this.date);
    this.osView.html(this.os);
    this.groupView.html(this.group);
    this.sectionA.prop( "checked", this.section['A'] );
    this.sectionB.prop( "checked", this.section['B'] );
    this.sectionC.prop( "checked", this.section['C'] );
    this.forcebox.prop( "checked", this.force);
  }



  //Fake_DB
  var user1={
    active: true,
    id: 'dédé_du_69',
    number: '0673645293',
    date: '11/11/1111',
    os: 'ios',
    group: 'group1',
    section: {A:false,B:false,C:true},
    force: true
  }
  userPool.addUser(user1);
  var user2={
    active: false,
    id: 'croco',
    number: '0653674843',
    date: '43/85/1897',
    os: 'android',
    group: 'group2',
    section: {A:false,B:true,C:false},
    force: true
  }
  userPool.addUser(user2);
  var user3={
    active: true,
    id: 'aziz',
    number: '0635426354',
    date: '49/36/1897',
    os: 'android',
    group: 'group2',
    section: {A:true,B:true,C:false},
    force: false
  }
  userPool.addUser(user3);

});
