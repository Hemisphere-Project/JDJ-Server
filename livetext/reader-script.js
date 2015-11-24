
$(function() {


    var text='temp text ceci est un texte essai';
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
    }


    // auto scroll down
    window.setInterval(function() {
      $('body').animate({scrollTop: document.body.scrollHeight}, 1000);
    }, 6000);



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
