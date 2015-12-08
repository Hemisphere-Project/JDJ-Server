<?php


// print_r($_FILES);

for($i=0; $i<count($_FILES); $i++){

  // move_uploaded_file($_FILES[$i]['tmp_name'],"../../files/{$_FILES[$i]['name']}");
  $ext = pathinfo($_FILES[$i]['name'], PATHINFO_EXTENSION);
  $ext = strtolower($ext);
  if ($ext == 'mp3' || $ext == 'wav' || $ext == 'aiff' || $ext == 'mp4' || $ext == 'avi' || $ext == 'mov'  || $ext == 'txt') {
    // move_uploaded_file($_FILES[$i]['tmp_name'],"../../files/{$_FILES[$i]['name']}");
    $newname = strtolower($_FILES[$i]['name']);
    // $newname = str_replace(' ', '', $newname);
    $newname = preg_replace("/[^a-zA-Z0-9]/", "", $newname);
    // $newname = wd_remove_accents($newname);
    move_uploaded_file($_FILES[$i]['tmp_name'],"../../files/{$newname}");
  }
  else echo 'wrong file type';
}


function wd_remove_accents($str, $charset='utf-8')
{
    $str = htmlentities($str, ENT_NOQUOTES, $charset);
    $str = preg_replace('#&([A-za-z])(?:acute|cedil|caron|circ|grave|orn|ring|slash|th|tilde|uml);#', '\1', $str);
    $str = preg_replace('#&([A-za-z]{2})(?:lig);#', '\1', $str); // pour les ligatures e.g. '&oelig;'
    $str = preg_replace('#&[^;]+;#', '', $str); // supprime les autres caractères
    return $str;
}

// function toASCII( $str )
// {
//     return strtr(utf8_decode($str),
//         utf8_decode(
//         '" \'ŠŒŽšœžŸ¥µÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýÿ'),
//         '___SOZsozYYuAAAAAAACEEEEIIIIDNOOOOOOUUUUYsaaaaaaaceeeeiiiionoooooouuuuyy');
// }

?>
