<?php


$oldfilename = $_POST['oldname'];
$newfilename = $_POST['newname'];

$oldfile = '../files/'.$oldfilename;
$newfile = '../files/'.$newfilename;

rename($oldfile,$newfile);


?>
