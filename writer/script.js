
$(function() {


  var text='temp text';
  var progressText = 0;


  function buildText(){
    var textArray = text.split('');
    $.each(textArray, function(index,char){
      var charDiv = $('<span>').addClass("singleChar untyped").html(char).appendTo($("#visuText"));
    });
  }


  document.onkeydown = function(e){
    progressText ++;
    actuVisu();
  }

  function actuVisu(){
    $('.singleChar').each(function(key, charDiv){
      if (key < progressText){
        $(charDiv).removeClass('untyped').addClass('typed');
      }
    });
  }

  //attendre arrivée d'un progress pour afficher texte

  // stocker progress recu dans un coin. quand on s'arrete de taper, comparer


   socket.emit('keypressed', true);


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
  });

  socket.on('progress', function (data) {

  });


});
