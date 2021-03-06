
IO_PORT = 8088;

console.log('Hello Teleco');

var clock = [0,0,0]
var init10clock = false

$(function() {

  // touch devices: 'click' triggered 300ms after touchstart
  // .on('click touchstart') trigger 2 events ou touch devices: touchstart and a ghost click (after 300ms delay)
  // ---> best way to remove the 300ms delay : fastclick
  // https://github.com/ftlabs/fastclick
  FastClick.attach(document.body);

  var categorySelected = 'files';
  var episodeSelected = 'all';
  var noSelection = true; // pour remettre à zéro la selectabilité des fichiers
  
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                       CLOCK
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  
  function updateClock() {
		$.get( "php/time.php", function( data ) {
			$('#clockDisplay').html(data.replace(' ','&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>')+'</strong>')
			clock = data.split(' ')[1].split(':')
			
			// init +10min clock
			if (!init10clock) {
				$('#hour').val(clock[0]);
				$('#min').val(parseInt(clock[1])+10);
				$('#sec').val(0);
				init10clock = true;
			}
  
		});
	}
	updateClock()
	setInterval(updateClock, 1000);

  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                       BROWSER
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  allFiles = new Array();

  function browser(){

    this.addFile = function(filename){
        allFiles.push(new file(filename));
    }

    this.getActiveFile = function(){
      var activeF;
      $.each(allFiles, function(index,file){
        if (file.selected == true){ activeF = file; }
      });
      return activeF;
    }

    this.unselectAllFiles = function(){
      $.each(allFiles,function(index,file){
        file.view.removeClass('fileSelected');
        if (file.icondelete) {file.icondelete.removeClass('trashView').addClass('trashHide');}
        file.selected = false;
      });
      $("#selectedFileGO").html("no file selected");
      // $('#sendFile').hide();
      noSelection = true;
    }

  }
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                      FILE
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  function file(filename){

    this.filename = filename;
    this.shortname = filename.split('.')[0];
    this.category = 'unknown';
    this.episode = 'unknown';
    this.selected = false;
    var thisfile = this;

    this.getCategory = function(){
      var extension = thisfile.filename.split('.')[1];
      if (extension == "mp3"||extension == "aiff"||extension == "wav") { thisfile.category = "audio" ;}
      else if (extension == "mov"||extension == "mp4"||extension == "avi"||extension == "mpg") { thisfile.category = "video" ;}
      else if (extension == "sms") { thisfile.category = "sms" ;}
      else if (extension == "txt") { thisfile.category = "text" ;}
      else if (extension == "url") { thisfile.category = "url" ;}
      else if (extension == "pad") { thisfile.category = "pad" ;}
      else if (extension == "phone") { thisfile.category = "phone" ;}
      else { thisfile.category = "unknown" ; }
    }
    this.getEpisode = function(){
      var episode = parseInt(thisfile.filename.split('_')[0].charAt(2));
      if(episode>=0 && episode <= 9)this.episode=episode;
      else {this.episode="unknown";}
    }
    this.getCategory();
    this.getEpisode();

    //BUILD ICONS
    //general div
    this.view = $('<div>').addClass(''+thisfile.category+' '+thisfile.episode+' view').appendTo( $('#mediasList') );
    //icon
    if (this.category=="audio"){ this.icon = $('<div>').addClass('icon fa fa-file-audio-o').attr('id', this.filename).appendTo( thisfile.view ); }
    if (this.category=="video"){ this.icon = $('<div>').addClass('icon fa fa-file-video-o').attr('id', this.filename).appendTo( thisfile.view ); }
    if (this.category=="url"){ this.icon = $('<div>').addClass('icon fa fa-file-code-o').attr('id', this.filename).appendTo( thisfile.view ); }
    if (this.category=="sms"){ this.icon = $('<div>').addClass('icon fa fa-commenting-o').attr('id', this.filename).appendTo( thisfile.view ); }
    if (this.category=="text"){ this.icon = $('<div>').addClass('icon fa fa-file-text-o').attr('id', this.filename).appendTo( thisfile.view ); }
    if (this.category=="pad"){ this.icon = $('<div>').addClass('icon fa fa-file-powerpoint-o').attr('id', this.filename).appendTo( thisfile.view ); }
    if (this.category=="phone"){ this.icon = $('<div>').addClass('icon fa fa-mobile').attr('id', this.filename).appendTo( thisfile.view ); }
    if (this.category=="unknown"){ this.icon = $('<div>').addClass('icon fa fa-question-circle').attr('id', this.filename).appendTo( thisfile.view ); }
    //filename
    var tab=this.filename.split(/[_-]/);
    var nameTemp="";
    if(tab.length>3){nameTemp+=tab[0]+"_"+tab[1]+"_"+tab[2]+"_ "; for (i=3;i<tab.length;i++){nameTemp+=tab[i];}}else{nameTemp=this.filename;}
    this.icontext = $('<div>').html(nameTemp).addClass(''+thisfile.category+' icontext').appendTo( thisfile.view );
    // trash
    if (this.category != 'phone'){
      this.icondelete = $('<div>').attr('id', "suppr").addClass('trashHide fa fa-trash-o').appendTo( thisfile.view );
    }



    //SELECT
    this.view.on('click',function(){
      var prevSelected = browser.getActiveFile();
      browser.unselectAllFiles();
      categorySelected = thisfile.category;
        $('.browserOptions').hide();
        if (categorySelected == "sms") {$('#smsOptions').show();}
        if (categorySelected == "text") {$('#textOptions').show();}
        if (categorySelected == 'audio'){$('#audioPreview').show();}
        else { pauseAudio(); }
        if (categorySelected == 'video'){$('#videoPreview').show();}
        else { pauseVideo(); }
        if (categorySelected == 'url'){  $('#urlOptions').show();}
        if (categorySelected == 'pad'){$('#livePad').show(); $('#playtime,#playdelay').hide();}
        else{$('#playtime,#playdelay').show();}
      $("#selectedFileGO").html(thisfile.filename);
      if(categorySelected=='sms'){$("#selectedFileGO").addClass('sms');} else {$("#selectedFileGO").removeClass('sms');}
      thisfile.view.addClass('fileSelected');
      thisfile.selected = true;
      if (thisfile.icondelete) { thisfile.icondelete.addClass('trashView'); }

      if ((prevSelected)&&(prevSelected.filename!=thisfile.filename)||(noSelection)){ // NOT SAME FILE & not first file || NO FILE SELECTED
        if (thisfile.category == 'audio'){
           $("#audioPlayer").attr("src", "../files/"+thisfile.filename);
        }
        if (thisfile.category == 'video'){
           $("#videoPlayer").attr("src", "../files/"+thisfile.filename);
        }
        stopAudio();
        stopVideo();
        if (thisfile.category == 'sms'){ getSmsContent(); }
        if (thisfile.category == 'text'){ getTextContent(); }
        if (thisfile.category == 'url'){ getUrlContent(); }
        if (thisfile.category == 'pad'){ getPadContent(); }
      }
      noSelection = false;


      // $('#sendFile').show();
    });



    // FILE DELETE
    if (this.category != 'phone'){
      this.icondelete.on('click',function(){
        // if (confirm("Supprimer ce fichier ?") == true) { deleteActiveFile(); }
        $(".overlay").fadeIn(100);
        $("#delete_false, #delete_true").unbind();
        $("#delete_false").on('click',function(){
          $(".overlay").fadeOut(100);
        });
        $("#delete_true").on('click',function(){
          deleteActiveFile();
          $(".overlay").fadeOut(100);
        });
      });
    }

    // FILE RENAME
    if (this.category != 'phone'){
      var nameTemp = $('<input>').attr('type', 'text').addClass('textRename');
      this.icontext.dblclick(function(){
        ///UNBIND ?????????? a priori non
        thisfile.icontext.hide();
        thisfile.view.append(nameTemp);
        nameTemp.val(thisfile.filename);
        nameTemp.focus();
        listenValidate();
      });
    }
    function listenValidate(){
      nameTemp.keypress(function(e) {
        if (e.keyCode == 13){
          thisfile.icontext.text(this.value); // Possibilité d'alléger? (on fait ca une fois sur l'objet et une 2e fois avec rename php) --> A voir avec le temps de réponse ajax
          nameTemp.remove();
          thisfile.icontext.show();
          if (thisfile.filename != this.value){
            renameFile(thisfile.filename,this.value);
          }
        }
      });
      nameTemp.focusout(function(e) {
        thisfile.icontext.text(this.value);
        nameTemp.remove();
        thisfile.icontext.show();
        if (thisfile.filename != this.value){
          renameFile(thisfile.filename,this.value);
        }
      });
    }

    //

  }

  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                    FILE OPERATIONS
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  renameFile = function(oldname,newname){
    console.log("Rename start");
    $.ajax({
        url: "php/files.php",
        type: "POST",
        data: { action: 'rename', oldname: oldname, newname: newname }
    }).done(function(reponse){
      getFiles();
    });
  }

  deleteActiveFile = function(){
    var fileToDelete;
    $.each(allFiles, function(index,file){
      if (file.selected == true){ fileToDelete= file.filename; }
    });

    $.ajax({
        url: "php/files.php",
        type: "POST",
        data: { action: 'delete', fileName: fileToDelete}
    }).done(function(reponse){
      getFiles();
    });
  }

  saveFileContent = function(content, name, ext) {
    $.ajax({
        url: "php/files.php",
        type: "POST",
        data: {
            action: 'save',
            contents: content,
            filename: name,
            extension: ext
        }
    })
    .done(function(reponse) {
      getFiles();
    }
    );
  }

  loadFileContent = function(name, onSuccess) {
    $.ajax({
        url: "php/files.php",
        dataType: "text",
        type: "POST",
        data: {
            action: 'load',
            filename: name
        }
    })
    .done(onSuccess);
  }



  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                 BROWSER
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  browser = new browser();
  getFiles();
  // var allFilenames = ["son1.mp3", "son2.mp3", "video1.mov", "Video2.mov", "url1", "sms1.txt" ];
  var allPhoneFunctions = ['lightOn.phone', 'lightOff.phone', 'lightStrobe.phone', 'vibre.phone'];

  function getFiles(){
    console.log("GET FILES");
    allFilenames = [];
    allFiles = [];
    $('#mediasList').empty();
    $.ajax({
        url: "php/files.php",
        type: "POST",
        data: { action: 'list' }
    })
    .done(function(filelist) {
      var allFilenames = JSON.parse(filelist);;
      //console.log(allFilenames);
      $.each(allFilenames, function(index,filename){
        browser.addFile(filename);
      });
      $.each(allPhoneFunctions, function(index, fonction){
        browser.addFile(fonction);
      });
      if (categorySelected != 'none'){ sortBrowser(); }
      browser.unselectAllFiles();
    });
  }


  $('.browserOptions').hide();
  $('#browserUploader').show();

  function sortBrowser(){
    $('.view').hide();
    if(episodeSelected == "all"){
      $('.'+categorySelected+'').show();
      if (categorySelected == 'files'){ $('.view').show(); }
    }else{
      $('.'+categorySelected+'.'+episodeSelected).show();
      if (categorySelected == 'files'){ $('.'+episodeSelected).show(); }
    }
  }

  $(".selector").on('click', function(){

    var color1 = "white";
    var color2 = "black";
    if (location.search.indexOf('night=true') > -1) {
        color2 = "#999";
        color1 = "black";
    }

    // COLOR STYLE
    $(".selector").css("background-color", color1);
    $(".selector").css("color", color2);
    $(this).css("background-color", color2);
    $(this).css("color", color1);

    categorySelected = $(this).attr("id");
    if(categorySelected != 'files')browser.unselectAllFiles();

    // SPECIAL DISPLAYS
    $('.browserOptions').hide();


    if (categorySelected == "sms") {
    $('#smsOptions').show();
    }

    if (categorySelected == "text") {
    $('#textOptions').show();
    }

    if (categorySelected == 'audio'){
      $('#audioPreview').show();
    }
    else { pauseAudio(); }

    if (categorySelected == 'video'){
      $('#videoPreview').show();
    }
    else { pauseVideo(); }

    if (categorySelected == 'url'){
      $('#urlOptions').show();
    }

    if (categorySelected == 'pad'){
      $('#livePad').show();
      $('#playtime,#playdelay').hide();
    }
    else{
      $('#playtime,#playdelay').show();
    }

    if (categorySelected == 'files'){
      $('#browserUploader').show();
      // $('.view').show(); // show all files
      // return; // exit & don't sort browser
    }

    //
    sortBrowser();
  });

  $(".selectorEp").on('click', function(){
    if(episodeSelected != $(this).attr("id")) {
    episodeSelected = $(this).attr("id");
    var color1 = "white";
    var color2 = "black";
    if (location.search.indexOf('night=true') > -1) {
        color2 = "#999";
        color1 = "black";
    }

    // COLOR STYLE
    $(".selectorEp").css("background-color", color1);
    $(".selectorEp").css("color", color2);
    $(this).css("background-color", color2);
    $(this).css("color", color1);


    browser.unselectAllFiles();

    sortBrowser();
    }
  });

  $(".selectorEp").on('dblclick', function(){
    if(episodeSelected != 'all' && episodeSelected != 'unknown') {
      gotoCategory('files');
      sortBrowser();
    }
  });

  function gotoCategory(category){
    $("#"+category).click();
  }

  // BROWSER SIZING
  // $(window).on('resize', function(){
  //     var win = $(this);
  //     console.log(win.height());
  // });

  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                      UPLOADER
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  //UPLOAD STYLE
  $("#fileInput").change(function(){
    $("#talkBox").empty();
    var filesChosen = $('#fileInput')[0].files;
    if (filesChosen.length == 1){ $("#talkBox").text(filesChosen[0].name); }
    else $("#talkBox").text( filesChosen.length+" fichiers" );
    $('progress').attr({value:0,max:100}); // remettre progress bar à 0
  });

  $("#inputLabel").onchange = $("#inputLabel").onmouseout = function () {
  $("#fileInput").click();
  }

  // UPLOAD
  $("#fileForm").on("submit", function(event){
    event.preventDefault(); //On empêche de submit le form
    var filesChosen = $('#fileInput')[0].files;
    var formdata = false;
    if (window.FormData) { formdata = new FormData(); }

    if (filesChosen.length != 0){
      var reader;
      $.each(filesChosen, function(index,file){
        // if (window.FileReader) {
        //         reader = new FileReader();
        //         reader.readAsDataURL(file);
        //     }
        if (formdata){
          formdata.append(index, file);
        }
      });
      $.ajax({
        xhr: function() {
        myXhr = $.ajaxSettings.xhr();
        if(myXhr.upload){
          myXhr.upload.addEventListener('progress',afficherAvancement, false);
        }
        return myXhr;
        },
        url         : 'php/files.php?action=upload',
        data        : formdata ? formdata : form.serialize(),
        cache       : false,
        contentType : false,
        processData : false,
        type        : 'POST',
        success     : function(data, textStatus, jqXHR){
          console.log(data);
          $("#talkBox").text("Upload done");
          $("#fileInput").val('');
          getFiles();
        }
     });
    }
  });

  function afficherAvancement(e){
   if(e.lengthComputable){
      $('#uploadProgress').attr({value:e.loaded,max:e.total});
   }
  }


    ///////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////
    //                      AUDIO PLAYER
    ///////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////

    var audioPlayer = $("#audioPlayer")[0];

    $("#audioPlay").on('click',function(){
        playAudio();
    });

    $("#audioPause").on('click',function(){
        pauseAudio();
    });

    function playAudio(){
      $("#audioPlay").hide();
      $("#audioPause").show();
      audioPlayer.play();
    }
    function pauseAudio(){
      $("#audioPause").hide();
      $("#audioPlay").show();
      audioPlayer.pause();
    }

    function stopAudio(){
      $("#audioPause").hide();
      $("#audioPlay").show();
      audioPlayer.pause();
      // audioPlayer.currentTime = 0; //DONT WORK IN FIREFOX
      updateAudio();
    }

    audioPlayer.ontimeupdate = function(){
      updateAudio();
    };
    function updateAudio(){
      var duration = audioPlayer.duration;
      var time = audioPlayer.currentTime;
      $('#timeCount').html(formatTime(time));
      $('#audioProgress').attr({value:time,max:duration});
    }

    function formatTime(time) {
      var hours = Math.floor(time / 3600);
      var mins  = Math.floor((time % 3600) / 60);
      var secs  = Math.floor(time % 60);
      if (secs < 10) {
          secs = "0" + secs;
      }
      if (hours) {
          if (mins < 10) {
              mins = "0" + mins;
          }
          return hours + ":" + mins + ":" + secs; // hh:mm:ss
      } else {
          return mins + ":" + secs; // mm:ss
      }
    }

    $('#audioProgress').on('click',function(e){
      var percent = e.offsetX / this.offsetWidth;
      audioPlayer.currentTime = percent * audioPlayer.duration;
      this.value = percent / 100; // set value direct (si time stream)
    });

    ///////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////
    //                      VIDEO PLAYER
    ///////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////

    var videoPlayer = $("#videoPlayer")[0];

    $("#videoPlay").on('click',function(){
        playVideo();
    });

    $("#videoPause").on('click',function(){
        pauseVideo();
    });

    function playVideo(){
      $("#videoPlay").hide();
      $("#videoPause").show();
      videoPlayer.play();
    }
    function pauseVideo(){
      $("#videoPause").hide();
      $("#videoPlay").show();
      videoPlayer.pause();
    }

    function stopVideo(){
      $("#videoPause").hide();
      $("#videoPlay").show();
      videoPlayer.pause();
      // videoPlayer.currentTime = 0; // DONT WORK IN FIREFOX
      updateVideo();
    }

    videoPlayer.ontimeupdate = function(){
      updateVideo();
    };
    function updateVideo(){
      var duration = videoPlayer.duration;
      var time = videoPlayer.currentTime;
      $('#videotimeCount').html(formatTime(time));
      $('#videoProgress').attr({value:time,max:duration});
    }

    $('#videoProgress').on('click',function(e){
      var percent = e.offsetX / this.offsetWidth;
      videoPlayer.currentTime = percent * videoPlayer.duration;
      this.value = percent / 100; // set value direct (si time stream)
    });



  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                       URL
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  $('#saveUrl').on('click', function () {
    var urlTitle = $("#urlTitle").val();
    var urlContent = $("#urlContent").val();

    saveFileContent(urlContent, urlTitle, 'url');

  });

  function getUrlContent(){
    var fileO = browser.getActiveFile();
    var filename = fileO.filename;
    var shortname = fileO.filename.split('.')[0];
    $("#urlTitle").val(shortname);

    loadFileContent(filename, function(contents)
    {
      $("#urlContent").val(contents);
      $("#frame").attr("src", contents+"&output=embed");
    });
  }

  $("#viewUrl").on('click',function(){
    var url = $("#urlContent").val();
    window.open(url);
  });




  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                       SMS
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  $('#smsContent').keyup(function () {
    charCount();
  });

  function charCount(){
    var max = 160;
    var len = $('#smsContent').val().length;
    $('#smsCount').text(max-len +' left');
  }

  $("#addDeeplink").on('click',function(){
    var max = 160;
    var len = $('#smsContent').val().length;
    if (len < (max-11) ){
      $('#smsContent').val($('#smsContent').val()+' *deeplink* ');
    }
    $('#smsContent').focus();
    charCount();
  });

  $("#checksms").on('click',function(){
    var sms=$('#smsContent').val();
    sms=sms.replace(/[^@èéùìòÇn_ !"#&'()*+,-./0123456789:;<=>?ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜabcdefghijklmnopqrstuvwxyzäöñüà]/g,'█')
    $('#smsContent').val(sms);
  });

  $('#saveSms').on('click', function () {
    var smsTitle = $("#smsTitle").val();
    var smsContent = $("#smsContent").val();

    saveFileContent(smsContent, smsTitle, 'sms');

  });


  function getSmsContent(){
    var fileO = browser.getActiveFile();
    var filename = fileO.filename;
    var shortname = fileO.filename.split('.')[0];
    $("#smsTitle").val(shortname);

    loadFileContent(filename, function(contents) {
      $("#smsContent").val(contents);
    });
  }

  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                       TEXT
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  $('#textContent').keyup(function () {
    var max = 160;
    var len = $('#textContent').val().length;
    $('#textCount').text(max-len +' left');
  });


  $('#saveText').on('click', function () {
    var textTitle = $("#textTitle").val();
    var textContent = $("#textContent").val();

    saveFileContent(textContent, textTitle, 'txt');

  });

  function getTextContent(){
    var fileO = browser.getActiveFile();
    var filename = fileO.filename;
    var shortname = fileO.filename.split('.')[0];
    $("#textTitle").val(shortname);

    loadFileContent(filename, function(contents) {
      $("#textContent").val(contents);
    });
  }

  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                    LIVE PAD
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  $('#savePad').on('click', function () {
    var padTitle = $("#padTitle").val();
    var padContent = $("#padContent").val();

    saveFileContent(padContent, padTitle, 'pad');

  });

  function getPadContent(){
    var fileO = browser.getActiveFile();
    var filename = fileO.filename;
    var shortname = fileO.filename.split('.')[0];
    $("#padTitle").val(shortname);

    loadFileContent(filename, function(contents) {
      $("#padContent").val(contents);
    });
  }


  $("#viewPad").on('click',function(){
    var url = 'http://'+document.location.hostname+'/livepad/writer.html';
    window.open(url);
  });


  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                      SEND REQUEST
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  $('.group').on('click', function() {
    var activeClass;
    // if ($(this).hasClass("day")) activeClass = "day";
    if ($(this).hasClass("group")) {activeClass = "group";}
    $('.'+activeClass).removeClass('fa fa-dot-circle-o').addClass('fa fa-circle-o');
    $(this).removeClass('fa-circle-o').addClass('fa-dot-circle-o');
    //Check corresponding hidden radio
    $(this).prev('input.radio').prop('checked', true);
  });

  // $('#notif').change(function() {
  //   console.log($('input[name=notifSms]').prop('checked'));
  // });


  // SEND PLAY
  $(".starter").on('click',function(){
    var fileToSend = $("#selectedFileGO").text();
    var who = $('input[name=group]:radio:checked').val();
    var notif = $('input[name=notifSms]').prop('checked');
    var time;
    
    var timeNow = new Date();
    timeNow.setHours(clock[0]);
    timeNow.setMinutes(clock[1]);
    timeNow.setSeconds(clock[2]);
    
    if ($(this).hasClass("NOW") == true) {
     time = 0;
    }
    if ($(this).hasClass("DELAY") == true) {
      // time = $("#delay").val()*60;
      time = $( "#delayslider" ).slider('value')*60;
    }
    if ($(this).hasClass("TIME") == true) {
      
      var timePlay = new Date();
      timePlay.setHours($('#hour').val());
      timePlay.setMinutes($('#min').val());
      timePlay.setSeconds($('#sec').val());
      
      var delay = timePlay.getTime() - timeNow.getTime();
      if (delay<0){ delay = delay + 86400000; } // 24h
      time = Math.round(delay/1000);
    }

    var data = {
      filename: fileToSend,
      category: categorySelected,
      when:time,
      who:who,
      eventid: eventselectedID,
      notif: notif,
      localTime: timeNow.getTime()
    };

    if (fileToSend != "no file selected"){
     socket.emit('play', data);
     //console.log('play '+data.category+' '+data.when+' '+data.who+' '+data.notif+' '+ data.filename);
     console.log(data);
    }
  });

  // SEND STOP
  $("#stopAll").on('click',function(){
    socket.emit('stop',{eventid: eventselectedID});
  });

  // SEND VIBRATE
  $("#vibeBtn").on('click',function(){
    var data = {
        filename: "vibre.phone",
        category: "phone",
        when:0,
        who:$('input[name=group]:radio:checked').val(),
        eventid: eventselectedID,
        notif: $('input[name=notifSms]').prop('checked'),
        localTime: new Date().getTime()
    };
    socket.emit('play', data );
  });

  // SEND VIBRATE
  $("#vibeBtn").on('click',function(){
    var data = {
        filename: "vibre.phone",
        category: "phone",
        when:0,
        who:$('input[name=group]:radio:checked').val(),
        eventid: eventselectedID,
        notif: $('input[name=notifSms]').prop('checked'),
        localTime: new Date().getTime()
    };
    socket.emit('play', data );
  });

  // SEND SOUND
  $("#SoundBtn").on('click',function(){
    var data = {
        filename: "NEW_Notif1.mp3",
        category: "audio",
        when:0,
        who:$('input[name=group]:radio:checked').val(),
        eventid: eventselectedID,
        notif: $('input[name=notifSms]').prop('checked'),
        localTime: new Date().getTime()
    };
    socket.emit('play', data );
  });

  // SEND TEXT VIDE
  $("#videtextBtn").on('click',function(){
    var data = {
        filename: "VIDE.txt",
        category: "text",
        when:0,
        who:$('input[name=group]:radio:checked').val(),
        eventid: eventselectedID,
        notif: $('input[name=notifSms]').prop('checked'),
        localTime: new Date().getTime()
    };
    socket.emit('play', data );
  });



  // custom number inputs
  $('.exactHour').on('change', function(){
    var maxtime = parseInt($(this).prop('max'));
    var time = $(this).val();
    if (time > maxtime){ $(this).val(maxtime); }
  });

  $('.exactHour').on('keydown', function(e){
    if (e.keyCode == 13){ $(this).blur();}
  });

  // Custom Slider jquery Ui + touch punch
  $( "#delayslider" ).slider({
        orientation: "horizontal",
        range: "min",
        max: 20,
        value: 5,
        slide: sliderVal,
        change: sliderVal
      });
  function sliderVal(){
    $('#delayslider_val').html($( "#delayslider" ).slider('value')+' min');
  }
  // $("#delay").on('change', function(){
  //   var delay = $(this).val();
  //   $("#delayView").html(delay+" min");
  // });


  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                     TASK MANAGER
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  pendingTasks = new Array();
  allTasks = new Array();

  url = 'http://'+document.location.hostname+':'+IO_PORT;
  console.log("Connecting to ", url);
  var socket = io(url);

	socket.on('connect', function () {
    console.log('Connected to Server: '+url);
    $('#serverState').toggleClass('inactive', false).toggleClass('active', true);
  });

  socket.on('disconnect', function () {
    console.log('Disconnected from Server');
    $('#serverState').toggleClass('inactive', true).toggleClass('active', false);
  });

  socket.on('status', function (data) {
    if (data.clientCount<=1){ $('#clientsDisplay').html(data.clientCount+" client"); }
    else { $('#clientsDisplay').html(data.clientCount+" clients"); }
    if (data.controllerCount<=1){ $('#controlDisplay').html(data.controllerCount+" controleur"); }
    else { $('#controlDisplay').html(data.controllerCount+" controleurs"); }
  });

  socket.on('tasks', function (data) {
    pendingTasks = data.pendingtasks;
    actuManager();
    actuLastTask(data.lasttask);
  });


  function Task(timeStamp, task){

    this.filename = task.filename;
    this.who = task.who;
    this.selected = false;
    var thisTask = this;

    //MANAGE TIME DISPLAY
    //timeStamp: heure server de l'event
    //localTime+delay: heure locale de l'event
    thisTask.timeStamp = timeStamp;
    this.date = new Date(task.localTime+task.when*1000);
    this.hour = this.date.getHours();
    this.min = this.date.getMinutes();
    if (this.min <=9){ this.min = '0'+this.min; }
    this.timeForm = this.hour+'H'+this.min;
    // VIEW
    this.view = $('<div>').addClass('taskView').appendTo( $('#taskManager') );
    this.icontext = $('<div>').html(this.timeForm+' - '+this.filename+' - '+this.who).addClass('taskText').appendTo( thisTask.view );
    this.icondelete =  $('<div>').attr('id', "deleteTask").addClass('delHide fa fa-times').appendTo( thisTask.view );
    // SELECT
    this.view.on('click',function(){
      unselectAllTasks();
      thisTask.view.addClass('fileSelected');
      thisTask.selected = true;
      thisTask.icondelete.addClass('delView');
    });
    // DELETE
    this.icondelete.on('click',function(){
      console.log("DELETE TASK");
      removeTask(thisTask.timeStamp);
    });

  } // end task object

  function unselectAllTasks(){
    $.each(allTasks,function(index,task){
      task.selected=false;
      task.view.removeClass('fileSelected');
      task.icondelete.removeClass('delView').addClass('delHide');
    });
  }

  function removeTask(timeStamp){
    // delete en local pour réactivité
    delete pendingTasks[timeStamp];
    actuManager();
    // delete server
    socket.emit('remove', timeStamp);
  }


  function actuManager(){
    $('#taskManager').empty();
    allTasks = [];
    // remplissage allTasks par ordre croissant keys (timeStamps)
    var keys = Object.keys(pendingTasks);
    keys.sort();
    $.each(keys, function(index,key){
      var timeStamp = key;
      var task = pendingTasks[key];
      allTasks.push(new Task(timeStamp,task));
    });
  }

  function actuLastTask(task){
    console.log(task);
    var viewOrder;
    if(task.action=='stop'){ viewOrder=task.action +' <br><br>'; }
    if(task.action=='play'){ if (task.group === undefined){task.group='-';} if (task.section === undefined){task.section='-';} viewOrder=task.category+' : '+ task.filename+' <br>group : '+task.group+' '+task.section+' , notif : '+task.notif; }
    $("#lastTask").html(viewOrder);
  }

  $("#viewUsers").on('click',function(){
    var url = 'http://'+document.location.hostname+'/users/index.html';
    window.open(url);
  });


  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                     EVENT MANAGER
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  socket.on('allevents', function(data) {
    // events
    allEvents = data.events;
    buildEvents();
    // current event
    console.info(data);
    if (data.currentevent) {
      $('#eventselector').val(data.currentevent.date);
      eventselectedID = data.currentevent.id;
    }
  });


  var dateselected;
  var eventselectedID = 0;
  allEvents = new Array();
  // fake DB
  // var event1={id:'1', place:'IEOYU', date: '18/32/7623', startH:'18', startM:'07' };
  // allEvents.push(event1);
  // var event2={id:'2',  place:'IUEJ', date: '62/76/1563', startH:'17', startM:'24' };
  // allEvents.push(event2);
  // var event3={id:'3',  place:'ZUIYZ', date: '74/27/8273', startH:'19', startM:'32' };
  // allEvents.push(event3);

  buildEvents();

  function buildEvents(){
    $('#eventselector').empty();
    allEvents.reverse();
    for(i=0;i<allEvents.length;i++){
      event=allEvents[i];
      if(i>0){
        $("#eventselector").append(('<option value_id="'+event.id+'" value="'+event.date+'">'+event.place+' - '+event.date+'</option>'));
      }else{
        $("#eventselector").append(('<option value_id="'+event.id+'" value="'+event.date+'" selected="selected">'+event.place+' - '+event.date+'</option>'));
          dateselected = event.date;
            $.each(allEvents,function(index,event){
              if (dateselected == event.date){
                socket.emit('eventselected', event);
                eventselectedID = event.id;
              }
            });
          console.log('eventselected on start',eventselectedID);
      }

    }
    myselect = $('#eventselector');
    myselect[0].selected=true;

  }

  $('#eventselector').change(function(){
    dateselected = $('#eventselector option:selected').val();
    if (dateselected == 'all') eventselectedID = -1;
    else
      $.each(allEvents,function(index,event){
        if (dateselected == event.date){
          socket.emit('eventselected', event);
          eventselectedID = event.id;
        }
      });
    console.log('eventselected ',eventselectedID);
  });

  $("#restartServer").click(function(){
    socket.emit('restart');
  });




});
