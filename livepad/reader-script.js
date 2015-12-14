
$(function() {


  var text='waiting for text from server';
  var progressServer = 0;


  buildText();

  function buildText(){
    $("#visuText").empty();
    var textArray = text.split('');
    $.each(textArray, function(index,char){
      var charDiv = $('<span>').addClass("singleChar untyped").html(char).appendTo($("#visuText"));
    });
  }


  function actuVisu(){
    $('.singleChar').each(function(key, charDiv){
    $(this).removeClass('typed').addClass('untyped');
      if (key < progressServer){
        $(charDiv).removeClass('untyped').addClass('typed');
      }
    });
    autoscrolldown();
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
    text = data;
    buildText();
    initApp = true;
  });

  socket.on('progress', function (data) {
    progressServer = data;
    actuVisu();

  });




});
