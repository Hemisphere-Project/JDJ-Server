
$(function() {


  var text='waiting for text from server';
  var progressServer = 0;
  var falseText = false;

  buildText();

  function buildText(){
    $("#visuText").empty();
    var textArray = text.split('');
    $.each(textArray, function(index,char){
      var charDiv = $('<span>').addClass("singleChar untyped").html(char).appendTo($("#visuText"));

      if ($(charDiv).html() == '['){
        $(charDiv).addClass('falseStart');
        falseText = true;
      }
      if ($(charDiv).html() == ']'){
        $(charDiv).addClass('falseEnd');
        falseText = false;
      }
      if (falseText == true){
        $(charDiv).addClass('falseText');
      }

    });

    var cursor = $('<div>').addClass('cursor').html('').appendTo($("#visuText"));

  }



  function actuVisu(){
    $('.singleChar').each(function(key, charDiv){
    $(this).removeClass('typed').addClass('untyped');
      if (key < progressServer){
        $(charDiv).removeClass('untyped').addClass('typed');
      }
    });
    autoscrolldown();
    getLastChar();
  }

  function getLastChar(){
    var length = $('.typed').length;
    $('.typed').each(function(key, charDiv){
      if ( (key==(length-1) )&&($(charDiv).html()==']') ){
        console.log('START DELETE');
        deleteFalseText();
      }
    });
  }
  function deleteFalseText(){
    var textToDelete = new Array();
    $($(".falseText.typed").get().reverse()).each(function(index,div) {
     console.log($(div).html());
     textToDelete.push(div);
   });

   $.each(textToDelete, function(index,div){
     setTimeout(function(){ $(div).addClass('falseText_DELETED'); }, index*200);
     if (index == textToDelete.length-1){ console.log("end delete"); }
   });
  }


  var visuHeight;

  function autoscrolldown(){
    var documentHeight = document.body.scrollHeight;
    var newvisuHeight = $("#visuText").height();
    if (newvisuHeight != visuHeight){
      $('body').animate({scrollTop: document.body.scrollHeight}, 1000);
      // $('body').scrollTop(document.body.scrollHeight);
      visuHeight = newvisuHeight;
    }
  }

  function blink(){
    $('.cursor').fadeOut(100).delay( 700 ).fadeIn(100);
  }
  setInterval(blink, 1500 );

  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  //                     SOCKET
  ///////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////

  var IO_PORT = 8089;
  url = 'http://'+document.location.hostname+':'+IO_PORT;
  var socket = io(url);
  var initApp = true;

  socket.on('connect', function () {
    console.log('Connected to Server: '+url);
  });

  socket.on('fulltext', function (data) {
    console.log('fulltext '+data);
    text = data;
    buildText();
    initApp = true;
  });

  socket.on('progress', function (data) {
    console.log('progress '+data);
    progressServer = data;
    actuVisu();

  });




});
