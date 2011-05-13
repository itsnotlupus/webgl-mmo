<?php

$ip = $_SERVER['REMOTE_ADDR'];
$a = $_SERVER['HTTP_USER_AGENT'];

$log = fopen('log.txt','a+');

fputs($log, date("Y-m-d H:i:s")." $ip $a\n");

fclose($log);

?><!DOCTYPE HTML>
<html>
<head>
<meta charset="utf-8"/>
<title>MMO Game test</title>
<link rel="stylesheet" type="text/css" href="style.css" />
<script type="text/javascript" src="js/glMatrix-0.9.5.min.js"></script>
<script type="text/javascript" src="js/glcode.js"></script>
<script type="text/javascript" src="js/objectHandler.js"></script>
<script type="text/javascript" src="js/inputHandler.js"></script>
<script type="text/javascript" src="js/physicsEngine.js"></script>
<!--<script type="text/javascript" src="js/networkInterface.js"></script>-->
<script type="text/javascript" src="js/audioLibrary.js"></script>

</head>
<body onload="webGLStart()">
    <canvas id="canvas"></canvas>
    <textarea id="output"></textarea>
    <div id="info">
        <b>MMO game</b> - Created by <b>U. Kavaliauskas</b> and <b>R. Klementavičius</b>. More info - <a href="http://code.google.com/p/webgl-mmo/" target="_blank">http://code.google.com/p/webgl-mmo/</a>
    </div> 
 
    <div id="info2"> 
	Use WASD to move, right button hold to look around.
    </div> 
</body>
</html>
