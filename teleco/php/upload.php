<?php


for($i=0; $i<count($_FILES); $i++){

  $ext = pathinfo($_FILES[$i]['name'], PATHINFO_EXTENSION);
  $ext = strtolower($ext);
  if ($ext == 'mp3' || $ext == 'wav' || $ext == 'aiff' || $ext == 'mp4' || $ext == 'avi' || $ext == 'mov'  || $ext == 'txt') {
    // move_uploaded_file($_FILES[$i]['tmp_name'],"../../files/{$_FILES[$i]['name']}");
    // $newname = $_FILES[$i]['name'];
    $newname = clean_string($_FILES[$i]['name']);
    move_uploaded_file($_FILES[$i]['tmp_name'],"../../files/{$newname}");
  }
  else echo 'wrong file type';
}



function clean_string($str, $encoding='utf-8')
{
  // transformer les caractères accentués en entités HTML
  $str = htmlentities($str, ENT_NOQUOTES, $encoding);
  // remplacer les entités HTML ( "&ecute;" => "e", "&Ecute;" => "E", "Ã " => "a" ... )
  $str = preg_replace('#&([A-za-z])(?:acute|grave|cedil|circ|orn|ring|slash|th|tilde|uml);#', '\1', $str);
  // Remplacer les ligatures tel que : Œ, Æ ... ("Å“" => "oe")
  $str = preg_replace('#&([A-za-z]{2})(?:lig);#', '\1', $str);
  // Supprimer tout ce qui n'est pas a-z A-Z 0-9 _ ET POINTS !!!!
  $str = preg_replace("/[^a-zA-Z0-9_.]+/", "", html_entity_decode($str, ENT_QUOTES));
  return $str;
}




?>
