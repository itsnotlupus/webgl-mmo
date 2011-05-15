/*!
 * WebGl JavaScript implementation
 *
 * Copyright 2011, Ugnius Kavaliauskas
 *
 * Date: @DATE
 */

var canvas;
var info2;
var gl;
var csp = 0;
var shaderProgram;
var mtsp;
var lm;

var frame = 0;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrixStack = [];

var output;

var player = new Object();
var aa = new Array();

function webGLStart() {

    output = document.getElementById('output');
    output.height = 150;
    output.enabled = false;
    info2 = document.getElementById('info2');

    canvas = document.getElementById('canvas');
    try {
        gl = canvas.getContext("experimental-webgl");
        resize();
    } catch (e) {}
    if (!gl) {
        log("ERROR: Your broser does not seem to support WebGL!");
        info2.innerHTML = 'Visit http://code.google.com/p/webgl-mmo/ for browser information';
        alert("Your browser does not seem to support WebGL!");
        return;
    } else {
        log("INFO: WebGL context created successfully");
    }

    window.addEventListener('resize', function(){resize();}, false);
    
    lm = new LM(info2);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    shaderProgram = gl.createProgram();
    loadShaders(shaderProgram, 'vshader.sh', 'fshader.sh');
    mtsp = gl.createProgram();
    loadShaders(mtsp, 'terr_v.sh', 'terr_f.sh');
    
//    NI.init('ws://130.83.20.18:8001');
    IN.init( canvas );
    PE.init();
    
    
    OL.load('mapas', 'BIGmap.obj', mtsp, PE.getData);
//    OL.load('bigmap', 'bigmap.obj', mtsp);

    OL.load("vsky", 'vsky.obj', shaderProgram);
    OL.load('water', 'water.obj', shaderProgram);
//    OL.load("skybox", 'skybox.json', shaderProgram);
    OL.load("vader", 'vader.json', shaderProgram);
    OL.load("vader2", 'vader2.json', shaderProgram);
    
    
//    OL.load("terrain", 'terrain.json');
//    OL.load("teapot", 'teapot.json');
//    OL.load("monkey", 'monkey.json');
//    OL.load('box', 'box.obj', shaderProgram);

    player = newPlayer();

    lm.stthrd(tick);
}

function resize() {
    output.style.display = output.enabled ? "block" : "none";
    output.style.height = output.height + "px";
    output.style.width = window.innerWidth + "px";

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - (output.enabled ? output.height : 0);
    if ( canvas.height < 50 )
        canvas.height = 50;
    gl.viewport(0, 0, canvas.width, canvas.height);

    wasResize = true;
}

function log(text, skipnl) {
//    if ( !output.enabled || !output ) return;
    if ( skipnl === undefined )    output.innerHTML += "\n" + text;
    else                           output.innerHTML += text;
    output.scrollTop = output.scrollHeight;
}

function loadShaders(sp, vsf, fsf) {
    sp.ready = false;
    sp.vsh = null;
    sp.fsh = null;

    getShader(sp, gl.VERTEX_SHADER, 'sh/'+vsf);
    getShader(sp, gl.FRAGMENT_SHADER, 'sh/'+fsf);
}

function getShader(sp, type, url) {
    lm.newRes(url);
    var request = new XMLHttpRequest();
    request.open("GET", url);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            loadShader(sp, type, request.responseText, url);
            lm.gotRes(url);
        }        
    }
    request.send();
}

function loadShader(sp, type, shaderSrc, url) {
    var shader = gl.createShader(type);
    if (shader == null) {
        return null;
    }

    gl.shaderSource(shader, shaderSrc);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var infoLog = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        log('ERROR: loadShader() - failed to compile shader "' + url + '":');
        log(infoLog);
    }

    if (type == gl.VERTEX_SHADER) sp.vsh = shader;
    if (type == gl.FRAGMENT_SHADER) sp.fsh = shader;
    
    initShaders(sp);
}

function initShaders(sp) {

    if ( sp.vsh == null || sp.fsh == null ) {
        return;
    }

    gl.attachShader(sp, sp.vsh);
    gl.attachShader(sp, sp.fsh);
    gl.linkProgram(sp);

    if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) {
        log("ERROR: Could not initialise shaders!");
        return;
    }
    
    if ( sp === shaderProgram ) {
        sp.vpat = gl.getAttribLocation(sp, "aVerPosition");
        gl.enableVertexAttribArray(sp.vpat);
    
        sp.nat = gl.getAttribLocation(sp, "aVerNormal");
        gl.enableVertexAttribArray(sp.nat);
    
        sp.tcat = gl.getAttribLocation(sp, "aTexCoord");
        gl.enableVertexAttribArray(sp.tcat);
    
        sp.pMatrixUniform = gl.getUniformLocation(sp, "uPMatrix");
        sp.mvMatrixUniform = gl.getUniformLocation(sp, "uMVMatrix");
        sp.nMatrixUniform = gl.getUniformLocation(sp, "uNMatrix");
        sp.samplerUniform = gl.getUniformLocation(sp, "uSampler");
        sp.useTexturesUniform = gl.getUniformLocation(sp, "uUseTextures");
        sp.useLightingUniform = gl.getUniformLocation(sp, "uUseLight");
        sp.lightDirUniform = gl.getUniformLocation(sp, "uLightDir");
        sp.ambColorUniform = gl.getUniformLocation(sp, "uAmbColor");
        sp.dirColorUniform = gl.getUniformLocation(sp, "uDirColor");
        
    } else if ( sp === mtsp ) {
        sp.vpat = gl.getAttribLocation(sp, "aVerPosition");
        gl.enableVertexAttribArray(sp.vpat);
        sp.tcat = gl.getAttribLocation(sp, "aTexCoord");
        gl.enableVertexAttribArray(sp.tcat);
        sp.nat = gl.getAttribLocation(sp, "aVerNormal");
        gl.enableVertexAttribArray(sp.nat);
        
        sp.tex0Uniform = gl.getUniformLocation(sp, "uTex0");
        sp.tex1Uniform = gl.getUniformLocation(sp, "uTex1");
        sp.tex2Uniform = gl.getUniformLocation(sp, "uTex2");

        sp.pMatrixUniform = gl.getUniformLocation(sp, "uPMatrix");
        sp.mvMatrixUniform = gl.getUniformLocation(sp, "uMVMatrix");
        sp.nMatrixUniform = gl.getUniformLocation(sp, "uNMatrix");
        sp.lightDirUniform = gl.getUniformLocation(sp, "uLightDir");
        sp.ambColorUniform = gl.getUniformLocation(sp, "uAmbColor");
        sp.dirColorUniform = gl.getUniformLocation(sp, "uDirColor");
        
    }
    
    
    for ( u in sp )
        if ( sp[u] === undefined )
            log('WARNING: shader program has undefined variable "'+u+'"');

    sp.ready = true;
}

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function pPushMatrix() {
    var copy = mat4.create();
    mat4.set(pMatrix, copy);
    pMatrixStack.push(copy);
}

function pPopMatrix() {
    if (pMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    pMatrix = pMatrixStack.pop();
}

function pLastMatrix() {
    if (pMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mat4.set(pMatrixStack[pMatrixStack.length-1],pMatrix);
}

function mvLastMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mat4.set(mvMatrixStack[mvMatrixStack.length-1],mvMatrix);
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(csp.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(csp.mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(csp.nMatrixUniform, false, normalMatrix);
    
    gl.uniform3f(csp.ambColorUniform, 0.1, 0.1, 0.1);
    gl.uniform3f(csp.dirColorUniform, 1.0, 1.0, 1.0 );

    var adjustedLD = vec3.create();
    vec3.normalize([0.25, -1.0, 0.25], adjustedLD);
    vec3.scale(adjustedLD, -1);
    gl.uniform3fv(csp.lightDirUniform, adjustedLD);
}

function tick() {

    IN.handleInput();
    update();
    
    if ( IN.hfcs() ) // if browser window is in focus
        draw();
    
    frame++;

    setTimeout(tick, 1000/60);
}


var lastTime = 0;
var zoom = 10.0;

var xRot = 0;
var yRot = 0;
var zRot = 0;

function newPlayer() {
    var p = new Object();
    p.pos = new Object();
    p.pos.x = 0.0;
    p.pos.y = 10.0;
    p.pos.z = 0.0;
    p.dir = 0.0;
    p.skin = "vader2";
    p.ss = 1;
    
    return p;
}

var cp = vec3.create();
var spos = 0;
var speed = 0.11;
var zoommax = 20;

function update() {
    
    var move = false;
    var cmove = false;
    
    if ( spos == 0 ) {
        if (PE.ready) {
            spos = 1;
            move = true;
        }
    }
    
    if ( frame === 0 ) {        
        Math.PI2 = Math.PI * 2;        
        player.pos.x = 1.0; player.pos.y = 1.0;        
    }

    var timeNow = new Date().getTime();
    var elapsed = Math.min(timeNow - lastTime, 500);

    if( IN.ibd(IN.BUTTON_RIGHT) ) {        
        if ( IN.mdx() !== 0.0 || IN.mdy() !== 0.0 ) cmove = true;
        
        yRot -= 0.01 * IN.mdx();
        xRot -= 0.01 * IN.mdy();
        
        if ( yRot > Math.PI2 ) yRot -= Math.PI2;
        if ( yRot < Math.PI2 ) yRot += Math.PI2;
        if ( xRot > 1.5 ) xRot = 1.5;
        if ( xRot < -1.2 ) xRot = -1.2;
    }

    zoom += IN.mwd(); // mouse wheel diference
    if ( IN.mwd() !== 0 ) cmove = true;
    if ( zoom < 1.5 ) zoom = 1.5;
    if ( zoom > zoommax ) zoom = zoommax;

    if ( IN.wkp(IN.KEY_TILDE) ) {
        output.enabled = !output.enabled;
        resize();
    }
    
    if ( IN.wkp(IN.KEY_X) ) {
        output.innerHTML = '';
    }
    
    if ( IN.ikd(IN.KEY_W) ) {
        player.pos.x += Math.sin(yRot) * speed * elapsed;
        player.pos.z -= Math.cos(yRot) * speed * elapsed;
        player.dir = -yRot + Math.PI;
        move = true;
    }
    if ( IN.ikd(IN.KEY_S) ) {
        player.pos.x -= Math.sin(yRot) * speed * elapsed;
        player.pos.z += Math.cos(yRot) * speed * elapsed;
        player.dir = -yRot;    
        move = true;
    }
    if ( IN.ikd(IN.KEY_A) ) {
        player.pos.x -= Math.cos(yRot) * speed * elapsed;
        player.pos.z -= Math.sin(yRot) * speed * elapsed;
        player.dir = -yRot - Math.PI/2; 
        move = true;   
    }
    
    if ( IN.ikd(IN.KEY_D) ) {
        player.pos.x += Math.cos(yRot) * speed * elapsed;
        player.pos.z += Math.sin(yRot) * speed * elapsed;
        player.dir = -yRot + Math.PI/2;  
        move = true;  
    }
    
    // Web Sockets stuff
    //var ma = NI.getLast();
    //for (i in ma) {
    //    var c = ma[i].substring(0, 4);
    //    if ( c == 'NAP ' ) {    // new avatar position
    //        var nap = ma[i].slice(4,ma[i].length);
    //        nap = nap.split(',',5);
    //        if ( !aa[nap[0]] ) aa[nap[0]] = newPlayer();
    //        aa[nap[0]].pos = [];
    //        aa[nap[0]].pos.x = nap[1];
    //        aa[nap[0]].pos.y = nap[2];
    //        aa[nap[0]].pos.z = nap[3];
    //        aa[nap[0]].dir = nap[4];
    //        
    //    } else if ( c == 'ANS ' ) { // avatar new skin. id, skin
    //        var alr = ma[i].slice(4,ma[i].length);
    //        alr = alr.split(',',2);
    //        if ( !aa[alr[0]] ) aa[alr[0]] = newPlayer();
    //        aa[alr[0]].skin = ((alr[1]==0) ? "vader" : "vader2");
    //        
    //        if ( aa[alr[0]].ss == 0 )
    //            AL.play(((aa[alr[0]].skin=="vader") ? 'on0.ogg' : 'off0.ogg'));
    //        else
    //            aa[alr[0]].ss = 0;
    //            
    //    } else if ( c == 'ALR ' ) { // avatar left realm. id
    //        var alr = ma[i].slice(4,ma[i].length);
    //        var ta = new Array();
    //        for(x in aa)
    //            if(x!=alr) { ta[x] = aa[x]; }
    //        aa = ta;
    //    } else {
    //        log('got unknown code message: ' + ma[i]);
    //    }
    //}    
    
    if ( move ) {
        player.pos.y = PE.getHeight(player.pos.x, player.pos.z);
        //NI.send('MNP ' + player.pos.x + ',' + player.pos.y + ',' + player.pos.z + ',' + player.dir);
    }
    
    if ( move || cmove ) { // if camera moved we need to recalculate camera collision posibility
                
        var pos = vec3.create();
        vec3.set([player.pos.x, player.pos.y+1.5, player.pos.z], pos);
        
        var vdir = vec3.create();        
        vdir[0] = -Math.sin(yRot) * Math.cos(xRot);
        vdir[1] = Math.sin(xRot);
        vdir[2] = Math.cos(yRot) * Math.cos(xRot);        
        vec3.normalize(vdir);        
                
        var ret = PE.findCamDis(pos, vdir, zoom);        
        ret -= 0.4;
        
        vec3.scale(vdir, ret, cp);        
        vec3.add(cp, pos);
        vec3.scale(cp, -1.0);
        
    }
    
    if ( IN.wkp(IN.KEY_L) ) { // saber
        player.skin = (player.skin=="vader2") ? "vader" : "vader2";
        //NI.send('MNS ' + ((player.skin=="vader") ? 0 : 1));
        AL.play(((player.skin=="vader") ? 'on0.ogg' : 'off0.ogg'));
    }
    
    
    if ( IN.wkp(IN.KEY_C) ) {   // shader options for debuging purposes
        OL['mapas'].sp = OL['mapas'].sp === shaderProgram ? mtsp : shaderProgram;
//        OL['lowmap'].sp = OL['lowmap'].sp === shaderProgram ? mtsp : shaderProgram;
    }
    
    if ( IN.wkp(IN.KEY_SPACE) ) {
        log(player.pos.x + ' ' + player.pos.z);
    }

    lastTime = timeNow;
}

function draw() {
    if ( frame == 0 ) {
        mat4.identity(mvMatrix);
        //gl.cullFace( gl.FRONT );
        //gl.enable( gl.CULL_FACE );
    }
    if ( wasResize ) {
        mat4.perspective(45, canvas.width / canvas.height, 0.1, 15000.0, pMatrix);
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //to enable transparency stuff
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    //gl.enable(gl.BLEND);
    
    pPushMatrix();
    mvPushMatrix();

    mat4.rotate(pMatrix, xRot, [1, 0, 0]);
    mat4.rotate(pMatrix, yRot, [0, 1, 0]);
    mat4.translate(pMatrix, [0, cp[1], 0]);

    OL.draw("vsky");

    pLastMatrix();
    // camera movement
    mat4.rotate(pMatrix, xRot, [1, 0, 0]);
    mat4.rotate(pMatrix, yRot, [0, 1, 0]);
    mat4.translate(pMatrix, cp);

    //OL.draw("terrain");
    OL.draw("mapas");
    OL.draw('water');
//    OL.draw("bigmap");

    //OL.draw("monkey");
//    OL.draw("teapot");

//    mat4.rotate(mvMatrix, -yRot-Math.PI, [0, 1, 0]);
//    setMatrixUniforms();
//    OL.draw('box')
    
    mat4.translate(mvMatrix, [player.pos.x, player.pos.y, player.pos.z]);
    mat4.rotate(mvMatrix, player.dir, [0, 1, 0]);
    
    OL.draw(player.skin);
    
    
    // other avatars...
    for (i in aa) {
        var p = aa[i];
        
        mvLastMatrix();    
        mat4.translate(mvMatrix, [p.pos.x, p.pos.y, p.pos.z]);
        mat4.rotate(mvMatrix, p.dir, [0, 1, 0]);
        
        OL.draw(p.skin);
    }
    


    pPopMatrix();
    mvPopMatrix();

}

