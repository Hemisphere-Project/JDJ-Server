
$(function() {


  var text='temp text ceci est un texte essai';
  var progressLocal = 0;
  var progressServer = 0;
  var typingtimer;

  buildText();

  function buildText(){
    var textArray = text.split('');
    $.each(textArray, function(index,char){
      var charDiv = $('<span>').addClass("singleChar untyped").html(char).appendTo($("#visuText"));
    });
  }

  document.onkeydown = function(e){
    // actu visu locale
    progressLocal ++;
    actuVisu();
    socket.emit('keypressed', true);

    // actu visu avec progressServer apres 1 seconde d'inactivité
    clearTimeout(typingtimer);
    typingtimer = setTimeout(function(){
      console.log("done typing");
      synchroVisu();
    }, 1000);

  }

  function actuVisu(){
    $('.singleChar').each(function(key, charDiv){
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

  socket.on('connect', function () {
    console.log('Connected to Server: '+url);
  });

  socket.on('fulltext', function (data) {
    text = data.fulltext;
    buildText();
  });

  socket.on('progress', function (data) {
    progressServer = data.progress;
  });


});
