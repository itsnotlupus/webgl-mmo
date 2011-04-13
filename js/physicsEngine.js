var PE = new Object();

PE.init = function() {
    PE.ver = new Array();
    PE.tri = new Array();
}

PE.getData = function(data) {
    if ( data.vpa && data.vpa.length > 0 ) PE.vpa = new Float32Array(data.vpa);
    else {
        log("ERROR: PE.getData - data does not have vertices info!");        
        return;
    }
    
    if ( data.ia && data.ia.length > 0 ) PE.ia = new Uint16Array(data.ia);
    else {
        log("ERROR: PE.getData - data does not have indices info!");
        return;
    }
    
    PE.nt = data.ia.length / 3;
    
    log("got " + PE.nt + " triangles for terrain collision");
    
}

PE.test = function(x, y, i) {
    
    var a = [ PE.vpa[PE.ia[i*3]*3], PE.vpa[PE.ia[i*3]*3+1], PE.vpa[PE.ia[i*3]*3+2] ];
    var b = [ PE.vpa[PE.ia[i*3+1]*3], PE.vpa[PE.ia[i*3+1]*3+1], PE.vpa[PE.ia[i*3+1]*3+2] ];
    var c = [ PE.vpa[PE.ia[i*3+2]*3], PE.vpa[PE.ia[i*3+2]*3+1], PE.vpa[PE.ia[i*3+2]*3+2] ];
    
    if(PE.dot(x-a[0], y-a[2], a[2]-b[2], b[0]-a[0]) < 0) return false;
    if(PE.dot(x-b[0], y-b[2], b[2]-c[2], c[0]-b[0]) < 0) return false;
    if(PE.dot(x-c[0], y-c[2], c[2]-a[2], a[0]-c[0]) < 0) return false;
    

    var t = [b[0]-a[0], b[1]-a[1], b[2]-a[2], c[0]-a[0], c[1]-a[1], c[2]-a[2]];

    var A = t[1] * t[5] - t[2] * t[4];
    var B = t[2] * t[3] - t[0] * t[5];
    var C = t[0] * t[4] - t[1] * t[3];
    
    if ( A == 0 && B == 0 && C == 0 )
        return false;
    
    var mD = A*a[0] + B*a[1] + C*a[2];
    
    return (A*x + C*y - mD) / (-B);
}

PE.getHeight = function(x,z) {
    var top = -100.0;
    for(var i = 0; i < PE.nt; i++) {
        var y = PE.test(x, z, i);
        if (y !== false) {
            if ( y > top ) {
                top = y;
            }
        }
    }
    
    return top;
}

PE.gphot = function(x,z,i) {
    var y = NaN;
    var A = [ PE.vpa[PE.ia[i*3]*3], PE.vpa[PE.ia[i*3]*3+1], PE.vpa[PE.ia[i*3]*3+2] ];
    //var B = [ PE.vpa[PE.ia[i*3+1]*3], PE.vpa[PE.ia[i*3+1]*3+1], PE.vpa[PE.ia[i*3+1]*3+2] ];
    //var C = [ PE.vpa[PE.ia[i*3+2]*3], PE.vpa[PE.ia[i*3+2]*3+1], PE.vpa[PE.ia[i*3+2]*3+2] ];
    
    var v0 = new Object, v1 = new Object(), v2 = new Object();
    v0.x = PE.vpa[PE.ia[i*3+2]*3] - A[0];
    v0.z = PE.vpa[PE.ia[i*3+2]*3+2] - A[2];
    v1.x = PE.vpa[PE.ia[i*3+1]*3] - A[0];
    v1.z = PE.vpa[PE.ia[i*3+1]*3+2] - A[2];
    v2.x = x - A[0];
    v2.z = z - A[2];
    
    
    var d00 = PE.dot(v0.x, v0.z, v0.x, v0.z);
    var d01 = PE.dot(v0.x, v0.z, v1.x, v1.z);
    var d02 = PE.dot(v0.x, v0.z, v2.x, v2.z);
    var d11 = PE.dot(v1.x, v1.z, v1.x, v1.z);
    var d12 = PE.dot(v1.x, v1.z, v2.x, v2.z);
    
    var invd = 1 / (d00 * d11 - d01 * d01);
    var u = (d11*d02 - d01*d12) * invd;
    var v = (d00*d12 - d01*d02) * invd;
    
    return (u > 0) && (v > 0) && (u + v < 1);
    
    
    
    
}

PE.dot = function(ax,ay,bx,by){return ax*bx+ay*by;}

