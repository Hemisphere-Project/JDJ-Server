<?php


  $filename = $_POST['filename'];

  // echo $filename;

  $contents = file_get_contents('../files/'.$filename, FILE_USE_INCLUDE_PATH);

  echo $contents;


?>
