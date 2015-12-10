
$(function() {


  FastClick.attach(document.body);

  var dates=["19/36/1897","20/46/1897","49/36/1897","19/36/4397","43/85/1897","74/56/1783","94/94/1873","73/43/5432","94/43/6374"];
  $.each(dates,function(index,date){
    $("#datepicker").append(('<option value="'+date+'">'+date+'</option>'));
  });


  $('#datepicker').change(function(){
    // $("#dateviewer").html($('#datepicker option:selected').val());
  });

});
