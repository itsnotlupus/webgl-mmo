/*!
 * ObjectHandler JavaScript class for WebGL
 *
 * Copyright 2011, Ugnius Kavaliauskas
 *
 * Date: @DATE
 */

var OL = new Array();

OL.load = function(name, file, sp, drcb) {

    OL[name] = new Object();
    var o = OL[name];
    o.name = name;
    o.file = file;
    o.loaded = false;
    o.sp = sp;
    if( name == 'mapas' ) {
        o.tex1 = gl.createTexture();
        o.tex1.img = new Image();
        o.tex1.img.onload = function () {
            OL.handleLoadedTexture(o.tex1);
        }
        o.tex1.img.src = 'models/maptest.png';
        
        o.tex2 = gl.createTexture();
        o.tex2.img = new Image();
        o.tex2.img.onload = function () {
            OL.handleLoadedTexture(o.tex2);
        }
        o.tex2.img.src = 'models/crate.gif';
    }
    
    var lpi = o.file.lastIndexOf('.');
    if ( lpi == -1 ) { log('ERROR: OL.load - unknown file type ' + o.file); return; }
    o.ext = o.file.substr(lpi+1);
    
    if ( o.ext == 'json' ) {
        var request = new XMLHttpRequest();
        request.open("GET", 'models/'+o.file);
        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                OL.handleLoaded(o, JSON.parse(request.responseText), drcb);
            }
        }
        request.send();
    } else if ( o.ext == 'obj' ) {
        var request = new XMLHttpRequest();
        request.open("GET", 'models/'+o.file);
        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                OL.handleLoadedObj(o, request.responseText, drcb);
            }
        }
        request.send();
    } else {
        log("ERROR: ERROR: OL.load - unknown file type " + o.file);
    }

}

OL.handleLoaded = function( o, data, drcb ) {

    if ( data.tca == undefined || data.tca.length === 0) {
        o.tex = false;
//        log("WARNING: OL.handleLoaded() - Object \"" + o.name + "\" has no texture or no texture coordinates");
    } else {
        if ( data.tex !== undefined && data.tex ) {
            o.tex = gl.createTexture();
            o.tex.img = new Image();
            o.tex.img.onload = function () {
                OL.handleLoadedTexture(o.tex);
            }
            o.tex.img.src = 'models/'+data.tex;
        }

        o.tcb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, o.tcb);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.tca), gl.STATIC_DRAW);
        o.tcb.is = 2;
        o.tcb.ni = data.tca.length / o.tcb.is;
    }

    if ( data.vpa == undefined || data.vpa.length === 0 ) {
//        log("WARNING: OL.handleLoaded() - Object \"" + o.name + "\" has no vertices coordinates");
    } else {
        o.vpb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, o.vpb);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vpa), gl.STATIC_DRAW);
        o.vpb.is = 3;
        o.vpb.ni = data.vpa.length / o.vpb.is;
    }

    if ( data.na  == undefined || data.na.length === 0 ) {
//        log("WARNING: OL.handleLoaded() - Object \"" + o.name + "\" has no normals");
    } else {
        o.nb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, o.nb);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.na), gl.STATIC_DRAW);
        o.nb.is = 3;
        o.nb.ni = data.na.length / o.nb.is;
    }

    if ( data.ia == undefined || data.ia.length === 0 ) {
//        log("WARNING: OL.handleLoaded() - Object \"" + o.name + "\" has no indices");
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

    if ( !o.vpb ) { log('ERROR: OL.handleLoaded - failed to laod object "' + o.name + '"'); return; }
    o.loaded = true;
        
    if ( drcb != undefined )
        drcb(data);
}

OL.handleLoadedObj = function( o, txt, drcb ) {
    
    var la = txt.split('\n');
    
    o.va = [];
    o.ta = [];
    o.na = [];
    o.fa = [];
    
    var data = new Object();
    data.vpa = new Array();
    data.tca = new Array();
    data.na = new Array();
    data.ia = new Array();
    data.tex = false;    
    
    for ( n in la ) {
        if ( la[n].length == 0 ) continue;
        lp = la[n].split(' ');
        if ( lp.length == 0 ) continue;
        if ( lp[0] == '#' ) {
            //log('Comment line in ' + o.file + ' ' + n);
            
        } else if ( lp[0] == 'o' ) {
            if ( lp.length >= 2 ) {
                //log('"' + lp[1].charAt(lp[1].length-1) + '"');
                //if ( lp[1].charAt(lp[1].length-1) == "\n" ) lp[1] = lp[1].substr(0,lp[1].length-3);
                //log('Object name "' + lp[1] + '" in ' + o.file + ' ' + n);
            } else {
                log('WARNING: OL.handleLoadedObj - Object tag with no name in ' + o.file + ' ' + n);
            }
            
        } else if ( lp[0] == 'v' ) {
            if ( lp.length == 4 ) {
                var v = [parseFloat(lp[1]),parseFloat(lp[2]),parseFloat(lp[3])];
                if ( v[0] != NaN && v[1] != NaN && v[2] != NaN )
                    o.va.push(v);
                else
                    log('WARNING: OL.handleLoadedObj - bad vertex data in ' + o.file + ' ' + n);
            } else {
                log('WARNING: OL.handleLoadedObj - wrong vertex data count in ' + o.file + ' ' + n);
            }
            
        } else if ( lp[0] == 'mtllib' ) {
            if ( lp.length < 2 ) { log('WARNING: OL.handleLoadedObj - wrong material file data in ' + o.file + ' ' + n); continue; }
            if ( lp[1].charCodeAt(lp[1].length-1) == 13 ) { lp[1] = lp[1].substr(0,lp[1].length-1) }
            
            var lpi = lp[1].lastIndexOf('.');
            if ( lpi == -1 ) { log('ERROR: OL.handleLoadedObj - material file name missing ' + lp[1] + ' in ' + o.file + ' ' + n); continue; }
            var ext = lp[1].substr(lpi+1);
            if ( ext != 'mtl' ) { log('ERROR: OL.handleLoadedObj - unknown meterial file type ' + lp[1] + ' in ' + o.file + ' ' + n); continue; }
            
            var request = new XMLHttpRequest();
            request.open("GET", 'models/'+lp[1]);
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    OL.handleLoadedMtl(o, request.responseText);
                }
            }
            request.send();
            
        } else if ( lp[0] == 'vt' ) {
            if ( lp.length == 3 ) {
                var v = [parseFloat(lp[1]),parseFloat(lp[2])];
                if ( v[0] != NaN && v[1] != NaN )
                    o.ta.push(v);
                else
                    log('WARNING: OL.handleLoadedObj - bad vertex texture data in ' + o.file + ' ' + n);
            } else {
                log('WARNING: OL.handleLoadedObj - wrong vertex texture data count in ' + o.file + ' ' + n);
            }
            
        } else if ( lp[0] == 'vn' ) {
            if ( lp.length == 4 ) {
                var v = [parseFloat(lp[1]),parseFloat(lp[2]),parseFloat(lp[3])];
                if ( v[0] != NaN && v[1] != NaN && v[2] != NaN )
                    o.na.push(v);
                else
                    log('WARNING: OL.handleLoadedObj - bad normal data in ' + o.file + ' ' + n);
            } else {
                log('WARNING: OL.handleLoadedObj - wrong normal texture data count in ' + o.file + ' ' + n);
            }
            
        } else if ( lp[0] == 'f' ) {
            if ( lp.length == 4 ) {
                if ( o.ta.length != 0 && o.na.length != 0 ) {
                    for ( var i = 1; i <= 3; i++ ) {
                        var ia = lp[i].split('/',3);
                        ia = [parseInt(ia[0]),parseInt(ia[1]),parseInt(ia[2])];
                        if ( ia[0] != NaN && ia[1] != NaN && ia[2] != NaN ) {
                            o.fa.push(ia);
                        } else
                            log('WARNING: OL.handleLoadedObj - bad face data in ' + o.file + ' ' + n);
                    }
                } else
                    log('WARNING: OL.handleLoadedObj - bad face data in ' + o.file + ' ' + n);
            } else {
                log('WARNING: OL.handleLoadedObj - wrong face data count in ' + o.file + ' ' + n);
            }
            
        } else {
//            log('WARNING: OL.handleLoadedObj - Unknown tag in ' + o.file + ' ' + n + ":" + la[n]);
        }
    }
    
    var mn = false; // merge normals
    if ( !mn ) {
        for ( var i = 0; i < o.fa.length; i++ ) {
            var f = o.fa[i];
            for ( var k = 0; k < 3; k++ )
                data.vpa.push(o.va[f[0]-1][k]);
            for ( var k = 0; k < 2; k++ )
                data.tca.push(o.ta[f[1]-1][k])
            for ( var k = 0; k < 3; k++ )
                data.na.push(o.na[f[2]-1][k])
        }
        
    }
    
    data.pvpa = new Array();
    data.pia = new Array();
    
    for ( var i = 0; i < o.va.length; i++ ) {
        for ( var k = 0; k < 3; k++ )
            data.pvpa.push(o.va[i][k]);
    }
    for ( var i = 0; i < o.fa.length; i++ ) {
        data.pia.push(o.fa[i][0]-1);
    }
    
    OL.handleLoaded(o, data, drcb );
}

OL.handleLoadedMtl = function(o, txt) {
    
    var la = txt.split('\n');
    
    for ( n in la ) {
        if ( la[n].length == 0 ) continue;
        lp = la[n].split(' ');
        if ( lp.length == 0 ) continue;
        
        if ( lp[0] == 'map_Kd' ) {
            if ( lp.length !== 2 ) { log('WARNING: OL.handleLoadedMtl - wrong material file data in ' + o.file + ' ' + n); continue; }
            if ( lp[1].charCodeAt(lp[1].length-1) == 13 ) { lp[1] = lp[1].substr(0,lp[1].length-1) }
            
            o.tex = gl.createTexture();
            o.tex.img = new Image();
            o.tex.img.onload = function () {
                OL.handleLoadedTexture(o.tex);
            }
            o.tex.img.src = 'models/'+lp[1];
            
        }
        
    }
}


OL.handleLoadedTexture = function(tex) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

OL.unload = function(name) {
    // TODO
}

OL.draw = function(name) {
    if ( OL[name] === undefined ) { log("ERROR: OL.draw() - no such object with name: " + name); return; }
    var o = OL[name];
    if ( !o.loaded ) return;
    if ( csp != o.sp ) { csp = o.sp; gl.useProgram(o.sp); }
    
    setMatrixUniforms();
    
    if ( csp === shaderProgram ) {
    
        gl.bindBuffer(gl.ARRAY_BUFFER, o.vpb);
        gl.vertexAttribPointer(csp.vpat, o.vpb.is, gl.FLOAT, false, 0, 0);
    
        if ( o.nb && o.name != 'vsky' ) {
            gl.uniform1i(csp.useLightingUniform, true);
            gl.enableVertexAttribArray(csp.nat);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, o.nb);
            gl.vertexAttribPointer(csp.nat, o.nb.is, gl.FLOAT, false, 0, 0);
        } else {
            gl.uniform1i(csp.useLightingUniform, false);
            gl.disableVertexAttribArray(csp.nat);
        }
    
        if ( o.tex ) {
            gl.bindBuffer(gl.ARRAY_BUFFER, o.tcb);
            gl.enableVertexAttribArray(csp.tcat);
            gl.vertexAttribPointer(csp.tcat, o.tcb.is, gl.FLOAT, false, 0, 0);
    
            gl.uniform1i(csp.useTexturesUniform, true);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, o.tex);
            gl.uniform1i(csp.samplerUniform, 0);
        } else {
            gl.disableVertexAttribArray(csp.tcat);
            gl.uniform1i(csp.useTexturesUniform, false);
        }
    
        if (o.ib !== undefined) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.ib);
            gl.drawElements(gl.TRIANGLES, o.ib.ni, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, o.vpb.ni);
        }
        
    } else if ( csp === mtsp ) {
        
        gl.bindBuffer(gl.ARRAY_BUFFER, o.vpb);
        gl.vertexAttribPointer(csp.vpat, o.vpb.is, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, o.tcb);
        gl.vertexAttribPointer(csp.tcat, o.tcb.is, gl.FLOAT, false, 0, 0);
        
        gl.enableVertexAttribArray(csp.nat);
        gl.bindBuffer(gl.ARRAY_BUFFER, o.nb);
        gl.vertexAttribPointer(csp.nat, o.nb.is, gl.FLOAT, false, 0, 0);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, o.tex);
        gl.uniform1i(csp.tex0Uniform, 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, o.tex1);
        gl.uniform1i(csp.tex1Uniform, 1);
        
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, o.tex2);
        gl.uniform1i(csp.tex2Uniform, 2);
        
        
        gl.drawArrays(gl.TRIANGLES, 0, o.vpb.ni);
    }


}
