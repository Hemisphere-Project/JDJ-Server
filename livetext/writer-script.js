
$(function() {


  var text='temp text ceci est un texte essai';
  var progressLocal = 0;
  var progressServer = 0;
  var typingtimer;

  buildText();

  function buildText(){
    $("#visuText").empty();
    var textArray = text.split('');
    $.each(textArray, function(index,char){
      var charDiv = $('<span>').addClass("singleChar untyped").html(char).appendTo($("#visuText"));
    });
  }

  document.onkeydown = function(e){
    triggerLetter();
  }
  $(window).on('click touchstart', function(){
    triggerLetter();
  });


  function triggerLetter(){
    // actu visu locale
    progressLocal ++;
    actuVisu();
    socket.emit('keypressed', 1);
    // actu visu avec progressServer apres 1 seconde d'inactivité
    clearTimeout(typingtimer);
    typingtimer = setTimeout(function(){
      console.log("done typing");
      synchroVisu();
    }, 1000);
  }

  function actuVisu(){
    $('.singleChar').each(function(key, charDiv){
    $(this).removeClass('typed').addClass('untyped');
      if (key < progressLocal){
        $(charDiv).removeClass('untyped').addClass('typed');
      }
    });
  }

  function synchroVisu(){
    progressLocal = progressServer;
    actuVisu();
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

    if (initApp == true){
      synchroVisu();
      initApp = false;
    }
  });


});
