<?php

  $filename = $_POST['filename'].'.live';
  // $filename = $_POST['filename'].'.rtf'; //Ne peut pas les ouvrir sous mac???

  $contents = $_POST['contents'];

  $file = fopen("../files/" . $filename, 'w+');
  fwrite($file, $contents);
  fclose($file);

  $response = 'success';
  echo $response;

?>
