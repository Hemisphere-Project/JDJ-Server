<?php


$dir = $_POST['directory'];

$dh  = opendir($dir);

while (false !== ($filename = readdir($dh))) {
    $files[] = $filename;
}

echo json_encode($files);


?>
