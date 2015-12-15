<?php

  $newname = clean_string($_POST['filename']);
  $filename = $newname.'.'.$_POST['extension'];

  // $filename = $_POST['filename'].'.'.$_POST['extension'];

  $contents = $_POST['contents'];

  $file = fopen("../../files/" . $filename, 'w+');
  fwrite($file, $contents);
  fclose($file);

  $response = 'success';
  echo $response;




  function clean_string($str, $encoding='utf-8')
  {
    // transformer les caractères accentués en entités HTML
    $str = htmlentities($str, ENT_NOQUOTES, $encoding);
    // remplacer les entités HTML ( "&ecute;" => "e", "&Ecute;" => "E", "Ã " => "a" ... )
    $str = preg_replace('#&([A-za-z])(?:acute|grave|cedil|circ|orn|ring|slash|th|tilde|uml);#', '\1', $str);
    // Remplacer les ligatures tel que : Œ, Æ ... ("Å“" => "oe")
    $str = preg_replace('#&([A-za-z]{2})(?:lig);#', '\1', $str);
    // Supprimer tout ce qui n'est pas a-z A-Z 0-9 _
    $str = preg_replace("/[^a-zA-Z0-9_]+/", "", html_entity_decode($str, ENT_QUOTES));
    return $str;
  }

?>
