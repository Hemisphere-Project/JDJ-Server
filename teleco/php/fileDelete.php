<?php


$filename = $_POST['fileName'];

$file = '../files/'.$filename;

//echo $file;

$fh = fopen($file, 'w') or die("can't open file");
fclose($fh);

unlink($file);

?>
