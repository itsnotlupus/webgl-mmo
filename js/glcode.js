/*!
 * WebGl JavaScript implementation
 *
 * Copyright 2011, Ugnius Kavaliauskas
 *
 * Date: @DATE
 */

var canvas;
var gl;
var shaderProgram;
var frame = 0;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrixStack = [];

var output;
var wasResize = true;

var player = new Object();
var aa = new Array();

function webGLStart() {

    output = document.getElementById('output');
    output.height = 200;
    output.enabled = true;

    canvas = document.getElementById('canvas');
    try {
        gl = canvas.getContext("experimental-webgl");
        resize();
    } catch (e) {}
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    } else {
        log("WebGL context created successfully");
    }

    window.addEventListener('resize', function(){resize();}, false);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    loadShaders();

    NI.init('ws://130.83.20.18:8001');
    IN.init();
    PE.init();

    OL.load("teapot", 'teapot.json');
    OL.load("skybox", 'skybox.json');
    OL.load("vader", 'vader.json');
    OL.load("vader2", 'vader2.json');
    OL.load("terrain", 'terrain.json', PE.getData);
    OL.load("monkey", 'monkey.json');

    player = newPlayer();

    tick();
}

function resize() {
    output.style.display = output.enabled ? "block" : "none";
    output.style.height = output.height-10 + "px";
    output.style.width = window.innerWidth + "px";

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - (output.enabled ? output.height : 0) - 5;
    if ( canvas.height < 50 )
        canvas.height = 50;
    gl.viewport(0, 0, canvas.width, canvas.height);

    wasResize = true;
}

function log(text) {
    if ( !output.enabled || !output ) return;
    output.innerHTML += text + "\n";
    output.scrollTop = output.scrollHeight;
}

function loadShaders() {

    shaderProgram = gl.createProgram();
    shaderProgram.ready = false;
    shaderProgram.vsh = null;
    shaderProgram.fsh = null;

    getShader(gl.VERTEX_SHADER, 'sh/vshader.sh');
    getShader(gl.FRAGMENT_SHADER, 'sh/fshader.sh');

    initShaders();
}

function getShader(type, url) {
    var request = new XMLHttpRequest();
    request.open("GET", url);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            loadShader(type, request.responseText);
        }
    }
    request.send();
}

function loadShader(type, shaderSrc) {
    var shader = gl.createShader(type);
    if (shader == null) {
        return null;
    }

    gl.shaderSource(shader,shaderSrc);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var infoLog = gl.getShaderInfoLog(shader);
        alert("Error compiling shader:\n" + infoLog);
        gl.deleteShader(shader);
        log("ERROR: loadShader() - failed to compile shader");
    }

    if (type == gl.VERTEX_SHADER) shaderProgram.vsh = shader;
    if (type == gl.FRAGMENT_SHADER) shaderProgram.fsh = shader;
}

function initShaders() {

    if ( shaderProgram.vsh == null || shaderProgram.fsh == null ) {
        setTimeout(initShaders, 1);
        return;
    }

    gl.attachShader(shaderProgram, shaderProgram.vsh);
    gl.attachShader(shaderProgram, shaderProgram.fsh);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVerPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVerNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTexCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.useTexturesUniform = gl.getUniformLocation(shaderProgram, "uUseTextures");
    shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");

    shaderProgram.ready = true;
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
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function tick() {

    IN.handleInput();
    update();
    draw();
    frame++;

    setTimeout(tick, 16);
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
    p.pos.y = 0.0;
    p.pos.z = 0.0;
    p.dir = 0.0;
    p.skin = "vader2";
    p.ss = 1;
    
    return p;
}

function update() {
    
    var lp = [player.pos.x, player.pos.y, player.pos.z, player.dir];

    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
    }


    if( IN.ibd(IN.BUTTON_RIGHT) ) {
        yRot -= 0.0006 * elapsed * IN.mdx();
        xRot -= 0.0006 * elapsed * IN.mdy();
    }

    zoom += IN.mwd();

    if ( IN.wkp(IN.KEY_TILDE) ) {
        output.enabled = !output.enabled;
        resize();
    }
    
    if ( IN.ikd(IN.KEY_W) ) {
        player.pos.x += Math.sin(yRot) * 0.01 * elapsed;
        player.pos.z -= Math.cos(yRot) * 0.01 * elapsed;
        player.dir = -yRot + Math.PI;    
    }
    if ( IN.ikd(IN.KEY_S) ) {
        player.pos.x -= Math.sin(yRot) * 0.01 * elapsed;
        player.pos.z += Math.cos(yRot) * 0.01 * elapsed;
        player.dir = -yRot;    
    }
    if ( IN.ikd(IN.KEY_A) ) {
        player.pos.x -= Math.cos(yRot) * 0.01 * elapsed;
        player.pos.z -= Math.sin(yRot) * 0.01 * elapsed;
        player.dir = -yRot - Math.PI/2;    
    }
    
    if ( IN.ikd(IN.KEY_D) ) {
        player.pos.x += Math.cos(yRot) * 0.01 * elapsed;
        player.pos.z += Math.sin(yRot) * 0.01 * elapsed;
        player.dir = -yRot + Math.PI/2;    
    }
    
    player.pos.y = PE.getHeight(player.pos.x, player.pos.z);
    
    var ma = NI.getLast();
    for (i in ma) {
        var c = ma[i].substring(0, 4);
        if ( c == 'NAP ' ) {    // new avatar position
            var nap = ma[i].slice(4,ma[i].length);
            nap = nap.split(',',5);
            if ( !aa[nap[0]] ) aa[nap[0]] = newPlayer();
            aa[nap[0]].pos = [];
            aa[nap[0]].pos.x = nap[1];
            aa[nap[0]].pos.y = nap[2];
            aa[nap[0]].pos.z = nap[3];
            aa[nap[0]].dir = nap[4];
            
        } else if ( c == 'ANS ' ) { // avatar new skin. id, skin
            var alr = ma[i].slice(4,ma[i].length);
            alr = alr.split(',',2);
            if ( !aa[alr[0]] ) aa[alr[0]] = newPlayer();
            aa[alr[0]].skin = ((alr[1]==0) ? "vader" : "vader2");
            
            if ( aa[alr[0]].ss == 0 )
                AL.play(((aa[alr[0]].skin=="vader") ? 'on0.ogg' : 'off0.ogg'));
            else
                aa[alr[0]].ss = 0;
                
        } else if ( c == 'ALR ' ) { // avatar left realm. id
            var alr = ma[i].slice(4,ma[i].length);
            var ta = new Array();
            for(x in aa)
                if(x!=alr) { ta[x] = aa[x]; }
            aa = ta;
        } else {
            log('got unknown code message: ' + ma[i]);
        }
    }    
    
    if ( lp[0] != player.pos.x || lp[1] != player.pos.y || lp[2] != player.pos.z || lp[3] != player.dir ) {
        NI.send('MNP ' + player.pos.x + ',' + player.pos.y + ',' + player.pos.z + ',' + player.dir);
    }
    
    if ( IN.wkp(IN.KEY_L) ) {
        player.skin = (player.skin=="vader2") ? "vader" : "vader2";
        NI.send('MNS ' + ((player.skin=="vader") ? 0 : 1));
        AL.play(((player.skin=="vader") ? 'on0.ogg' : 'off0.ogg'));
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
        mat4.perspective(45, canvas.width / canvas.height, 0.1, 2000.0, pMatrix);
    }
    if ( !shaderProgram.ready ) return;


    gl.uniform3f(shaderProgram.ambientColorUniform, 0.5, 0.5, 0.5);
    gl.uniform3f(shaderProgram.directionalColorUniform, 0.4, 0.4, 0.4 );

    var adjustedLD = vec3.create();
    vec3.normalize([0.25, -1.0, 0.25], adjustedLD);
    vec3.scale(adjustedLD, -1);
    gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
//    gl.enable(gl.BLEND);

    pPushMatrix();
    mvPushMatrix();

    mat4.rotate(pMatrix, xRot, [1, 0, 0]);
    mat4.rotate(pMatrix, yRot, [0, 1, 0]);

    setMatrixUniforms();
    OL.draw("skybox");

    pLastMatrix();
    // camera movement
    mat4.translate(pMatrix, [0, 0, -zoom]);
    mat4.rotate(pMatrix, xRot, [1, 0, 0]);
    mat4.rotate(pMatrix, yRot, [0, 1, 0]);
    mat4.translate(pMatrix, [-player.pos.x, -player.pos.y, -player.pos.z]);
    mat4.translate(pMatrix, [0, -1.8, 0]);
    setMatrixUniforms();

    OL.draw("terrain");

    //OL.draw("monkey");
//    OL.draw("teapot");


//    mat4.rotate(mvMatrix, -yRot-Math.PI, [0, 1, 0]);
//    setMatrixUniforms();
    
    mat4.translate(mvMatrix, [player.pos.x, player.pos.y, player.pos.z]);
    mat4.rotate(mvMatrix, player.dir, [0, 1, 0]);
    setMatrixUniforms();
    OL.draw(player.skin);
    
    for (i in aa) {
        var p = aa[i];
        
        mvLastMatrix();    
        mat4.translate(mvMatrix, [p.pos.x, p.pos.y, p.pos.z]);
        mat4.rotate(mvMatrix, p.dir, [0, 1, 0]);
        setMatrixUniforms();
        
        OL.draw(p.skin);        
    }


    pPopMatrix();
    mvPopMatrix();

}

