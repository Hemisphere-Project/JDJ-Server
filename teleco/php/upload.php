<?php

// print_r($_FILES);

for($i=0; $i<count($_FILES); $i++){

  // move_uploaded_file($_FILES[$i]['tmp_name'],"../files/{$_FILES[$i]['name']}");
  $ext = pathinfo($_FILES[$i]['name'], PATHINFO_EXTENSION);
  $ext = strtolower($ext);
  if ($ext == 'mp3' || $ext == 'wav' || $ext == 'aiff' || $ext == 'mp4' || $ext == 'avi' || $ext == 'mov'  || $ext == 'txt') {
    move_uploaded_file($_FILES[$i]['tmp_name'],"../files/{$_FILES[$i]['name']}");
  }
  else echo 'wrong file type';
}


?>
