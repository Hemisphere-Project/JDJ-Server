<?php

  $filename = $_POST['filename'].'.'.$_POST['extension'];

  $contents = $_POST['contents'];

  $file = fopen("../../files/" . $filename, 'w+');
  fwrite($file, $contents);
  fclose($file);

  $response = 'success';
  echo $response;

?>
