var PE = new Object();

PE.init = function() {
    PE.ver = new Array();
    PE.tri = new Array();
    PE.root = null;
    PE.ready = false;
}

PE.getData = function(data) {
    
    if ( PE.ver.length > 0 || PE.tri.length > 0 )
        log('WARNING: PE.getData - second call to getData(), removing last terrain data');
    
    if (  data.pvpa !== undefined && data.pia !== undefined ) {
        PE.vpa = new Float32Array(data.pvpa);
        PE.ia = new Uint16Array(data.pia);
        PE.nt = data.pia.length / 3;
    } else {    
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
    }
    
    PE.na = new Array();
    var a, b, c, t, i3, i4;
    for ( var i = 0; i < PE.nt; i++ ) {
        i3 = i+i+i;
        i4 = i3+i;
        a = [ PE.vpa[PE.ia[i3]*3], PE.vpa[PE.ia[i3]*3+1], PE.vpa[PE.ia[i3]*3+2] ];
        b = [ PE.vpa[PE.ia[i3+1]*3], PE.vpa[PE.ia[i3+1]*3+1], PE.vpa[PE.ia[i3+1]*3+2] ];
        c = [ PE.vpa[PE.ia[i3+2]*3], PE.vpa[PE.ia[i3+2]*3+1], PE.vpa[PE.ia[i3+2]*3+2] ];        
    
        t = [b[0]-a[0], b[1]-a[1], b[2]-a[2], c[0]-a[0], c[1]-a[1], c[2]-a[2]];
    
        PE.na.push( t[1] * t[5] - t[2] * t[4]);
        PE.na.push( t[2] * t[3] - t[0] * t[5]);
        PE.na.push(  t[0] * t[4] - t[1] * t[3]);
        PE.na.push(  -PE.na[i4]*a[0] - PE.na[i4+1]*a[1] - PE.na[i4+2]*a[2]);
    }
    
    PE.root = new qtree();
    for ( var i = 0; i < PE.nt; i++ )
        PE.root.tl.push(i);
    PE.root.checkBounds();
    
    PE.root.split();
    
//    log("got " + PE.nt + " triangles for terrain collision");
    
    PE.ready = true;
}

PE.getHeight = function(x,z) {
    if ( !PE.ready ) return -100.0;
    var max = -100.0;
    
    var ret = PE.root.gety(x, z);
    if ( ret !== false && ret > max )
        max = ret;
    
    return max;
}

PE.dot = function(ax,ay,bx,by){return ax*bx+ay*by;}

function qtree() {
    this.ne = null;
    this.se = null;
    this.sw = null;
    this.nw = null;
    
    this.tl = [];
    this.e = 0.0; this.s = 0.0; this.w = 0.0; this.n = 0.0;
    
}

qtree.prototype.gety = function (x, z) {
    if ( x > this.e || x < this.w || z > this.s || z < this.n ) return false;
        
    var max = 0.0;
    var ret;
    for ( i in this.tl ) {
        ret = this.testy(x,z,this.tl[i]);
        if ( ret !== false && ret > max )
            max = ret;
    }
    
    
    if ( this.ne !== null ) {
        ret = this.ne.gety(x, z);
        if ( ret !== false && ret > max )
            max = ret;
    }
    
    if ( this.se !== null ) {
        ret = this.se.gety(x, z);
        if ( ret !== false && ret > max )
            max = ret;
    }
    
    if ( this.sw !== null ) {
        ret = this.sw.gety(x, z);
        if ( ret !== false && ret > max )
            max = ret;
    }
    
    if ( this.nw !== null ) {
        ret = this.nw.gety(x, z);
        if ( ret !== false && ret > max )
            max = ret;
    }
    
    return max;
};

qtree.prototype.testy = function(x, y, i) {
    
    var i3 = i+i+i;
    var i2 = 0.0;
    
    i2 = PE.ia[i3]*3;   var a = [ PE.vpa[i2++], PE.vpa[i2++], PE.vpa[i2] ];
    i2 = PE.ia[i3+1]*3; var b = [ PE.vpa[i2++], PE.vpa[i2++], PE.vpa[i2] ];
    if(PE.dot(x-a[0], y-a[2], a[2]-b[2], b[0]-a[0]) > 0) return false;
    i2 = PE.ia[i3+2]*3; var c = [ PE.vpa[i2++], PE.vpa[i2++], PE.vpa[i2] ];
    if(PE.dot(x-b[0], y-b[2], b[2]-c[2], c[0]-b[0]) > 0) return false;
    if(PE.dot(x-c[0], y-c[2], c[2]-a[2], a[0]-c[0]) > 0) return false;
    
    i3 += i;
    var A = PE.na[i3];
    var B = PE.na[i3+1];
    var C = PE.na[i3+2];
    
    if ( A == 0 && B == 0 && C == 0 )
        return false;
        
    var mD = A*a[0] + B*a[1] + C*a[2];
    
    return (A*x + C*y - mD) / (-B);
}

qtree.prototype.split = function() {
    var ns = (this.e + this.w) / 2.0;
    var we = (this.s + this.n) / 2.0;
        
    this.ne = new qtree();
    this.se = new qtree();
    this.sw = new qtree();
    this.nw = new qtree();
    
    var ntl = [];
    
    for( li in this.tl ) {
        var i3 = this.tl[li]*3;
        var e, s, w, n;
        e = s = -1.0e10;
        w = n = 1.0e10;
        for ( var i = 0; i < 3; i++ ) {
            var tri = [ PE.vpa[PE.ia[i3+i]*3], PE.vpa[PE.ia[i3+i]*3+1], PE.vpa[PE.ia[i3+i]*3+2] ];
            if ( tri[0] > e ) e = tri[0];
            if ( tri[2] > s ) s = tri[2];
            if ( tri[0] < w ) w = tri[0];
            if ( tri[2] < n ) n = tri[2];
        }
        
        if ( n <= we && e > ns )
            this.ne.tl.push(this.tl[li]);
        if ( s > we && e > ns )
            this.se.tl.push(this.tl[li]);
        if ( s > we && w <= ns )
            this.sw.tl.push(this.tl[li]);
        if ( n <= we && w <= ns )
            this.nw.tl.push(this.tl[li]);
            
        
    }
    
    this.tl = ntl;
    this.ne.checkBounds();
    this.se.checkBounds();
    this.sw.checkBounds();
    this.nw.checkBounds();
    
    if ( this.ne.tl.length > 50 ) this.ne.split();
    if ( this.se.tl.length > 50 ) this.se.split();
    if ( this.sw.tl.length > 50 ) this.sw.split();
    if ( this.nw.tl.length > 50 ) this.nw.split();
    
}

qtree.prototype.checkBounds = function() {
    this.e = this.s = -1.0e10;
    this.w = this.n = 1.0e10;
    for ( t in this.tl ) {
        var i3 = this.tl[t]*3;
        for ( var i = 0; i < 3; i++ ) {
            var tri = [ PE.vpa[PE.ia[i3+i]*3], 0.0, PE.vpa[PE.ia[i3+i]*3+2] ];
            if ( tri[0] > this.e ) this.e = tri[0];
            if ( tri[2] > this.s ) this.s = tri[2];
            if ( tri[0] < this.w ) this.w = tri[0];
            if ( tri[2] < this.n ) this.n = tri[2];
        }
    }
}

qtree.prototype.testcam = function( ro, rd, min) {
    
    var l;
    l = [ ro[0], ro[0]+min*rd[0], ro[2], ro[2]+min*rd[2], 0 ];
    if ( l[0] > l[1] ) { l[4] = l[0]; l[0] = l[1]; l[1] = l[4]; }
    if ( l[2] > l[3] ) { l[4] = l[2]; l[2] = l[3]; l[3] = l[4]; }
    
    if ( l[1] < this.w || l[0] > this.e || l[3] < this.n || l[2] > this.s ) return min;
        
    var ret;
    for ( i in this.tl ) {
        ret = PE.rtid( ro, rd, this.tl[i], min );
        if ( ret < min ) min = ret;
    }
    
    if ( this.ne !== null ) {
        ret = this.ne.testcam(ro, rd, min);
        if ( ret < min ) min = ret;
    }
    
    if ( this.se !== null ) {
        ret = this.se.testcam(ro, rd, min);
        if ( ret < min ) min = ret;
    }
    
    if ( this.sw !== null ) {
        ret = this.sw.testcam(ro, rd, min);
        if ( ret < min ) min = ret;
    }
    
    if ( this.nw !== null ) {
        ret = this.nw.testcam(ro, rd, min);
        if ( ret < min ) min = ret;
    }
    
    return min;
}

// find nearest camera collision if any
PE.findCamDis = function(pos, vdir, ret) {
    if (PE.root == undefined)
        return 0.0;
    return PE.root.testcam( pos, vdir, ret );
 }

// ray triangle intersection distance
// ro - ray orgin (vec3)
// rd - ray direction (vec3)
// i - triagnle index in PE.ia array; (int)
PE.rtid = function( ro, rd, i, min ) {
        
    var i3 = i+i+i;
    var i2;
    i2 = PE.ia[i3]*3;   var a = [ PE.vpa[i2++], PE.vpa[i2++], PE.vpa[i2] ];
    i2 = PE.ia[i3+1]*3; var b = [ PE.vpa[i2++], PE.vpa[i2++], PE.vpa[i2] ];
    i2 = PE.ia[i3+2]*3; var c = [ PE.vpa[i2++], PE.vpa[i2++], PE.vpa[i2] ];
    
    i3 += i;
    var A = PE.na[i3];
    var B = PE.na[i3+1];
    var C = PE.na[i3+2];
    
    if ( A == 0 && B == 0 && C == 0 )
        return min;
    
    var tn = vec3.create();
    tn[0] = A, tn[1] = B, tn[2] = C;
    
    
    var D = PE.na[i3+3];
    
    var t = (-vec3.dot(ro,tn)-D)/vec3.dot(tn,rd);
    
    if ( t < 1.0 || t > min ) return min;
    
    var cp = vec3.create();
    vec3.scale(rd, t, cp );
    vec3.add(cp, ro);

    var ctc = vec3.create();
    var edge = vec3.create();
    var cr = vec3.create();
    var dot;
    
    vec3.subtract([b[0],b[1],b[2]],[a[0],a[1],a[2]],edge);
    vec3.cross( tn, edge, cr);
    vec3.subtract(cp,[a[0],a[1],a[2]],ctc);
    dot = vec3.dot(cr, ctc);
    if ( dot < 0 ) return min;
    
    vec3.subtract([c[0],c[1],c[2]],[b[0],b[1],b[2]],edge);
    vec3.cross( tn, edge, cr);
    vec3.subtract(cp,[b[0],b[1],b[2]],ctc);
    dot = vec3.dot(cr, ctc);
    if ( dot < 0 ) return min;
    
    vec3.subtract([a[0],a[1],a[2]],[c[0],c[1],c[2]],edge);
    vec3.cross( tn, edge, cr);
    vec3.subtract(cp,[c[0],c[1],c[2]],ctc);
    dot = vec3.dot(cr, ctc);
    if ( dot < 0 ) return min;
    
    return t;
    
}

