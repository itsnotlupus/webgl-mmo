/*!
 * InputHandler JavaScript Library
 *
 * Copyright 2011, Ugnius Kavaliauskas
 *
 * Date: @DATE
 */

var IN = new Object();

IN.KEY_F1 = 112;
IN.KEY_F2 = 113;
IN.KEY_F3 = 114;
IN.KEY_F4 = 115;
IN.KEY_F5 = 116;
IN.KEY_F6 = 117;
IN.KEY_F7 = 118;
IN.KEY_F8 = 119;
IN.KEY_F9 = 120;
IN.KEY_F10 = 121;
IN.KEY_F11 = 122;
IN.KEY_F12 = 123;

IN.KEY_0 = 48;
IN.KEY_1 = 49;
IN.KEY_2 = 50;
IN.KEY_3 = 51;
IN.KEY_4 = 52;
IN.KEY_5 = 53;
IN.KEY_6 = 54;
IN.KEY_7 = 55;
IN.KEY_8 = 56;
IN.KEY_9 = 57;

IN.KEY_A = 65;
IN.KEY_B = 66;
IN.KEY_C = 67;
IN.KEY_D = 68;
IN.KEY_E = 69;
IN.KEY_F = 70;
IN.KEY_G = 71;
IN.KEY_H = 72;
IN.KEY_I = 73;
IN.KEY_J = 74;
IN.KEY_K = 75;
IN.KEY_L = 76;
IN.KEY_M = 77;
IN.KEY_N = 78;
IN.KEY_O = 89;
IN.KEY_P = 80;
IN.KEY_Q = 81;
IN.KEY_R = 82;
IN.KEY_S = 83;
IN.KEY_T = 84;
IN.KEY_U = 85;
IN.KEY_V = 86;
IN.KEY_W = 87;
IN.KEY_X = 88;
IN.KEY_Y = 89;
IN.KEY_Z = 90;

IN.KEY_LEFT = 37;
IN.KEY_RIGHT = 39;
IN.KEY_UP = 38;
IN.KEY_DOWN = 40;
IN.KEY_SPACE = 32;
IN.KEY_ENTER = 13;
IN.KEY_BACKSPACE = 8;
IN.KEY_ESCAPE = 27;
IN.KEY_SHIFT = 16;
IN.KEY_CTRL = 17;
IN.KEY_ALT = 18;
IN.KEY_TAB = 9;
IN.KEY_CAPSLOCK = 20;
IN.KEY_TILDE = 192;
IN.KEY_PAUSE = 19;
//IN.KEY_ = ;
//IN.KEY_ = ;

IN.BUTTON_LEFT = 0;
IN.BUTTON_MIDDLE = 1;
IN.BUTTON_RIGHT = 2;

IN.init = function() {

    IN.kd = {};
    IN.kp = {};
    IN.kr = {};
    IN.kpq = {};
    IN.krq = {};

    IN.bd = {};
    IN.bp = {};
    IN.br = {};
    IN.bpq = {};
    IN.brq = {};

    IN.pmpx = 0;
    IN.pmpy = 0;
    IN.pmdx = 0;
    IN.pmdy = 0;
    IN.lmpx = 0;
    IN.lmpy = 0;

    IN.mwdq = 0;
    IN.pmwd = 0;

    window.oncontextmenu = function(){return false;};   // Right click menu suppresion

    window.onkeydown = function(e) {
        if ( !IN.kd[e.keyCode] )
            IN.kpq[e.keyCode] = true;
        IN.kd[e.keyCode] = true;

        if ( e.keyCode != IN.KEY_F11 && e.keyCode != IN.KEY_F5 )
            return false;
    }
    window.onkeyup = function(e) {
        IN.kd[e.keyCode] = false;
        IN.krq[e.keyCode] = true;
    }

    window.onblur = function() {
        for (kc in IN.kd) {
            if ( IN.kd[kc] )
                IN.krq[kc] = true;
            IN.kd[kc] = false;
        }
    }
    window.onfocus = function() {
    }

    window.onmousedown = function(e) {
        if ( !IN.bd[e.button] )
            IN.bpq[e.button] = true;
        IN.bd[e.button] = true;
        return false;
    }
    window.ondblclick = function(e) {
        return false;
    }
    window.onmouseup = function(e) {
        IN.bd[e.button] = false;
        IN.brq[e.button] = true;
    }
    window.onmousemove = function(e) {
        IN.pmpx = e.x;
        IN.pmpy = e.y;
    }
    window.addEventListener('mousewheel', function(e){
        IN.mwdq += e.wheelDelta / Math.abs(e.wheelDelta);
    }, false);

}

IN.handleInput = function() {
    IN.kp = IN.kpq;
    IN.kpq = {};
    IN.kr = IN.krq;
    IN.krq = {};

    IN.bp = IN.bpq;
    IN.bpq = {};
    IN.br = IN.brq;
    IN.brq = {};

    IN.pmdx = IN.lmpx - IN.pmpx;
    IN.pmdy = IN.lmpy - IN.pmpy;

    IN.lmpx = IN.pmpx;
    IN.lmpy = IN.pmpy;

    IN.pmwd = IN.mwdq;
    IN.mwdq = 0;
}

IN.wkp = function(key) { return IN.kp[key]; }
IN.wkr = function(key) { return IN.kr[key]; }
IN.ikd = function(key) { return IN.kd[key]; }

IN.wbp = function(but) { return IN.bp[but]; }
IN.wbr = function(but) { return IN.br[but]; }
IN.ibd = function(but) { return IN.bd[but]; }

IN.mpx = function() { return IN.pmpx; }
IN.mpy = function() { return IN.pmpy; }
IN.mdx = function() { return IN.pmdx; }
IN.mdy = function() { return IN.pmdy; }

IN.mwd = function() { return IN.pmwd; }

