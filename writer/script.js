
  $(function() {


    var text='Depuis le lancement de Framapad en 2011, son succès ne s’est pas démenti. Pour preuve, nos serveurs s’écroulent ! C’est pourquoi, depuis maintenant près de 2 ans, nous multiplions les instances d’Etherpad afin de garder un service réactif. Les soucis à répétition sur notre infrastructure qui ont eu lieu pendant les deux premiers mois de 2015 ont monopolisé notre attention. Du coup, la dernière instance de Framapad, lite5, s’est retrouvée à héberger près de 90 000 pads ! Depuis son lancement à la mi-octobre, cela fait quand même 18 000 pads par mois, soit 600 nouveaux pads par jour, ou 25 pads par heure !';
    var progressText = 0;

    var textArray = text.split('');

    $.each(textArray, function(index,char){
      var charDiv = $('<span>').addClass("singleChar untyped").html(char).appendTo($("#visuText"));
    });



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


    // keypressed
    //
    // fulltext
    // progress


});
