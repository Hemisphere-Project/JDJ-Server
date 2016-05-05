
$(function() {


  var text='waiting for text from server';
  var progressLocal = 0;
  var progressServer = 0;
  var typingtimer;

  buildText();

  function buildText(){
    $("#visuText").empty();
    var textLines = text.split('\n');
    $.each(textLines, function(ix, line)
    {
      var textArray = line.split('');
      $.each(textArray, function(index,char){
        var charDiv = $('<span>').addClass("singleChar untyped").html(char).appendTo($("#visuText"));
      });
      $("<span><br /></span>").addClass("singleChar untyped").appendTo($("#visuText"));
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
    // actu visu avec progressServer apres 500 ms d'inactivité
    clearTimeout(typingtimer);
    typingtimer = setTimeout(function(){
      console.log("done typing");
      synchroVisu();
    }, 500);
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
  url = 'https://'+document.location.hostname+':'+IO_PORT;
  var socket = io(url);
  var initApp = true;

  socket.on('connect', function () {
    console.log('Connected to Server: '+url);
  });

  socket.on('fulltext', function (data) {
    console.log(data);
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
