<?php


$dir = $_POST['directory'];

$dh  = opendir($dir);

while (false !== ($filename = readdir($dh))) {
    $files[] = $filename;
}

sort($files);
echo json_encode($files);


?>
