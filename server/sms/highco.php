<?php
require('./creditentials.php');

function HC_makeXmlPush($destinataires, $text, $date="2000-01-01", $time="00:00", $mode=1, $pretty=False)
{
  //PUSH
  $attributes = ['accountid'   =>  HC_ACCOUNTID,
                  'password'    =>  HC_PASSWORD,
                  'email'       =>  HC_EMAIL,
                  'class_type'  =>  $mode,
                  'name'        =>  HC_NAME,
                  'userdata'    =>  HC_USERDATA,
                  'datacoding'  =>  "8",            # 8: UTF-8
                  'start_date'  =>  $date,   # Avec une date dans le passé on tombe à ~ 5 secondes de délai d'envoi
                  'start_time'  =>  $time         # Avec une date dans le passé on tombe à ~ 5 secondes de délai d'envoi
                ];
  $push = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE push SYSTEM "push.dtd"><push/>');
  foreach ($attributes as $key => $value) {
    $push->addAttribute($key, $value);
  }

  //MESSAGE
  $message = $push->addChild('message');
  $message->addAttribute('class_type', $mode);

  //TEXT
  $text = $message->addChild('text', $text);

  //DEST
  foreach ($destinataires as $num) {
    $to = $message->addChild('to', $num);
    $to->addAttribute('ret_id', "TO_".$num);
  }

  $dom = new DOMDocument('1.0');
  $dom->preserveWhiteSpace = false;
  $dom->formatOutput = true;
  $dom->loadXML($push->asXML());
  return $dom->saveXML();
}

function HC_postXml($xml)
{
  $data = array('xml' => $xml);
  $options = array(
          'http' => array(
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($data),
      )
  );
  $context  = stream_context_create($options);
  if (HC_ENABLE) $result = file_get_contents(HC_SERVER, false, $context);
  return $result;
}

function HC_postSMS($dest, $message, $date="2000-01-01", $time="00:00")
{
  $XML = HC_makeXmlPush($dest,$message,$date,$time);
  return HC_postXml($XML);
}

?>
