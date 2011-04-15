/*!
 * WebSockets JavaScript implementation
 *
 * Copyright 2011, Ugnius Kavaliauskas
 *
 * Date: @DATE
 */


var NI = new Object();

NI.init = function(server) {
    NI.server = server;   
    NI.na = [];
    
    NI.connect();
    
    
    
}

NI.connect = function() {
    NI.s = new WebSocket(NI.server);
    NI.s.onopen = NI.onopen;
    NI.s.onclose = NI.onclose;
    NI.s.onmessage = NI.onmessage;
    
}

NI.onopen = function() {
    log("INFO: NetworkInterface - succesfuly connected to " + NI.server);
}

NI.onclose = function() {
    log("INFO: NetworkInterface::onclose - reporting");
}

NI.onmessage = function(event) {    
    msg = event.data.substring(8, event.data.length);
    NI.na.push(msg);
}

NI.send = function(m) {
    if (NI.s != null && NI.s.readyState === 1)
        NI.s.send(m);
}

NI.getLast = function() {
    var t = NI.na;
    NI.na = [];
    return t;
}