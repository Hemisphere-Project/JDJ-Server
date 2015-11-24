<?php
//TODO add security
$dest = json_decode($_POST['dest']);
$msg = $_POST['msg'];
$token = $_POST['token'];

if (count($dest) > 0 and $msg != '' and $token==3737)
{
  require ('./highco.php');
  HC_postSMS($dest, $msg);
}
?>
