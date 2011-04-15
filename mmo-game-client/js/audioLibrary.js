
var AL = new Object();

AL.init = function() {
    
}

AL.play = function(file,loop,volume) {
    var a = new Audio('sound/' + file);
    if ( loop )
        a.loop = loop;
    if ( volume ) {
        if ( volume <= 0.0 || volume > 1.0 )
            log('WARNING: AL.play - volume out of rage bounds: ' + volume);
        else {
            a.volume = volume;
            a.play();
        }
    } else
        a.play();
    return a;
}