/*!
 * ObjectHandler JavaScript class for WebGL
 *
 * Copyright 2011, Ugnius Kavaliauskas
 *
 * Date: @DATE
 */

var OL = new Array();

OL.load = function(name, file, drcb) {

    OL[name] = new Object();
    var o = OL[name];
    o.name = name;
    o.file = file;
    o.loaded = false;

    var request = new XMLHttpRequest();
    request.open("GET", 'models/'+o.file);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            OL.handleLoaded(o, JSON.parse(request.responseText), drcb);
        }
    }
    request.send();

}

OL.handleLoaded = function( o, data, drcb ) {

    if (!data.tex || !data.tca || data.tca.lenght == 0) {
        o.tex = false;
        log("WARNING: OL.handleLoaded() - Object \"" + o.name + "\" has no texture or no texture coordinates");
    } else {
        o.tex = gl.createTexture();
        o.tex.img = new Image();
        o.tex.img.onload = function () {
            OL.handleLoadedTexture(o);
        }
        o.tex.img.src = 'models/'+data.tex;

        o.tcb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, o.tcb);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.tca), gl.STATIC_DRAW);
        o.tcb.is = 2;
        o.tcb.ni = data.tca.length / o.tcb.is;
    }

    if ( !data.vpa || data.vpa.lenght == 0 ) {
        log("WARNING: OL.handleLoaded() - Object \"" + o.name + "\" has no vertices coordinates");
    } else {
        o.vpb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, o.vpb);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vpa), gl.STATIC_DRAW);
        o.vpb.is = 3;
        o.vpb.ni = data.vpa.length / o.vpb.is;
    }

    if ( !data.na || data.na.lenght == 0 ) {
        log("WARNING: OL.handleLoaded() - Object \"" + o.name + "\" has no normals");
    } else {
        o.nb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, o.nb);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.na), gl.STATIC_DRAW);
        o.nb.is = 3;
        o.nb.ni = data.na.length / o.nb.is;
    }

    if ( !data.ia || data.ia.lenght == 0 ) {
        log("WARNING: OL.handleLoaded() - Object \"" + o.name + "\" has no indices");
    } else {
        o.ib = gl.createBuffer();
        if ( data.iac ) {
            var ind = new Array(data.ia.length/4*6);
            for ( var i = 0; i < data.ia.length/4; i++ ) {
                ind[i*6+0] = data.ia[i*4+0];
                ind[i*6+1] = data.ia[i*4+1];
                ind[i*6+2] = data.ia[i*4+2];
                ind[i*6+3] = data.ia[i*4+0];
                ind[i*6+4] = data.ia[i*4+2];
                ind[i*6+5] = data.ia[i*4+3];
            }
            data.ia = ind;
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.ib);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.ia), gl.STATIC_DRAW);
        o.ib.is = 1;
        o.ib.ni = data.ia.length;
    }

    if ( o.vpb && o.ib )
        o.loaded = true;
        
    if ( drcb )
        setTimeout(drcb(data),0);
}


OL.handleLoadedTexture = function(o) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, o.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o.tex.img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

OL.unload = function(name) {
    // TODO
}

OL.draw = function(name) {
    if ( !OL[name] ) throw "ERROR: OL.draw() - no such object with name: " + name;
    var o = OL[name];
    if ( !o.loaded ) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, o.vpb);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, o.vpb.is, gl.FLOAT, false, 0, 0);

    if ( o.nb ) {
        gl.uniform1i(shaderProgram.useLightingUniform, true);
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, o.nb);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, o.nb.is, gl.FLOAT, false, 0, 0);
    } else {
        gl.uniform1i(shaderProgram.useLightingUniform, false);
        gl.disableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    }

    if ( o.tex ) {
        gl.bindBuffer(gl.ARRAY_BUFFER, o.tcb);
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, o.tcb.is, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaderProgram.useTexturesUniform, true);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, o.tex);
        gl.uniform1i(shaderProgram.samplerUniform, 0);
    } else {
        gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
        gl.uniform1i(shaderProgram.useTexturesUniform, false);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.ib);
    gl.drawElements(gl.TRIANGLES, o.ib.ni, gl.UNSIGNED_SHORT, 0);


}
