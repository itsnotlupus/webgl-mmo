<?php

$ip = $_SERVER['REMOTE_ADDR'];
$a = $_SERVER['HTTP_USER_AGENT'];

$log = fopen('log.txt','a+');

fputs($log, date("Y-m-d H:i:s")." $ip $a\n");

fclose($log);

?>