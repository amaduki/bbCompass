(function (global) {

//
//  code is quoated from...
//    base64.js,v 1.2 2011/12/27 14:34:49 dankogai Exp dankogai
//    https://github.com/dankogai/js-base64
//

    var b64chars 
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    var b64tab = function(bin){
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);

    var sub_toBase64 = function(m, Offset){
        var len=m.length;
        var padlen = (len<Offset+3)?[0, 2, 1][len-Offset]:0;
        var n = (Offset>=len   ? 0 :(m[Offset]   << 16))
              | (Offset+1>=len ? 0 :(m[Offset+1] <<  8))
              | (Offset+2>=len ? 0 :(m[Offset+2]      ));

        return b64chars.charAt( n >>> 18)
             + b64chars.charAt((n >>> 12) & 63)
             + (padlen >= 2 ? '' : b64chars.charAt((n >>> 6) & 63))
             + (padlen >= 1 ? '' : b64chars.charAt(n & 63));

    };

    var toBase64 = function(data){
        var i;
        var b64="";

        for (i=0;i<data.length;i=i+3) {
            b64 = b64+sub_toBase64(data,i);
        }

        return b64.replace(/[+\/]/g, function(m0){
                                         return m0 == '+' ? '-' : '_';
                                     });
    };

    var sub_fromBase64 = function(m, Offset){
        var ret= new Array();
        var n = (b64tab[ m.charAt(Offset    ) ] << 18)
              | (b64tab[ m.charAt(Offset + 1) ] << 12)
              | (b64tab[ m.charAt(Offset + 2) ] <<  6)
              | (b64tab[ m.charAt(Offset + 3) ]);

        ret.push(((n >> 16)       ),
                 ((n >>  8) & 0xff),
                 ((n      ) & 0xff));

        return ret;
    };

    var fromBase64 = function(b64){
        b64 = b64.replace(/[-_]/g, function(m0){
                                       return m0 == '-' ? '+' : '/';
                                   })
                 .replace(/[^A-Za-z0-9\+\/]/g, '');
        var padlen = 0;
        var data = new Array();
        var i;

        while(b64.length % 4){
            b64 += 'A';
            padlen++;
        }

        for (i=0;i<b64.length;i=i+4) {
            data=data.concat(sub_fromBase64(b64,i));
        }

        data = data.slice(0, data.length - [0,1,2,0][padlen]);
        return data;
    };


// Original code
    //バッファ arrayへの読み書き関数
    var setStr = function (text){
        var ret = Array();
        var code;

        ret[0]=text.length;
        for (i=0;i<text.length;i++) {
            code=text.charCodeAt(i);
            if (code & 0xffff0000) {
                ret.push((code & 0xff000000) >> 24,
                         (code & 0x00ff0000) >> 16,
                         (code & 0x0000ff00) >>  8,
                         (code & 0x000000ff)       );
            } else {
                ret.push((code & 0x0000ff00) >> 8,
                         (code & 0x000000ff)      );
            }
        }
        return ret;

    };

    var setInt8 = function (value){
        var ret = Array();
        ret[0] = value & 0x00ff
        return ret;
    };

    var setInt16 = function (value){
        var ret = Array();
        ret[1] = value & 0x00ff
        ret[0] = (value>>8) & 0x00ff
        return ret;
    };

    var floatToIntBits = function (f) {
        // this function is quoted from
        // http://stackoverflow.com/questions/3077718/converting-a-decimal-value-to-a-32bit-floating-point-hexadecimal

        var ret = Array();
        var NAN_BITS = 0|0x7FC00000; 
        var INF_BITS = 0|0x7F800000; 
        var ZERO_BITS = 0|0x00000000; 
        var SIGN_MASK = 0|0x80000000; 
        var EXP_MASK = 0|0x7F800000; 
        var MANT_MASK = 0|0x007FFFFF; 
        var MANT_MAX = Math.pow(2.0, 23) - 1.0; 

        if (f != f) 
            return NAN_BITS; 
        var hasSign = f < 0.0 || (f == 0.0 && 1.0 / f < 0); 
        var signBits = hasSign ? SIGN_MASK : 0; 
        var fabs = Math.abs(f); 

        if (fabs == Number.POSITIVE_INFINITY) 
            return signBits | INF_BITS; 

        var exp = 0, x = fabs; 
        while (x >= 2.0 && exp <= 127) { 
            exp++; 
            x /= 2.0; 
        } 
        while (x < 1.0 && exp >= -126) { 
            exp--; 
            x *= 2.0; 
        } 
        var biasedExp = exp + 127; 

        if (biasedExp == 255) 
            return signBit | INF_BITS; 
        if (biasedExp == 0) { 
            var mantissa = x * Math.pow(2.0, 23) / 2.0; 
        } else { 
            var mantissa = x * Math.pow(2.0, 23) - Math.pow(2.0, 23); 
        } 

        var expBits = (biasedExp << 23) & EXP_MASK; 
        var mantissaBits = mantissa & MANT_MASK; 

        return signBits | expBits | mantissaBits; 
    }

    var setFloat32 = function (f){
        var ret = new Array();
        var bits = floatToIntBits(f);

        ret[0] = (bits >> 24) & 0x000000ff;
        ret[1] = (bits >> 16) & 0x000000ff;
        ret[2] = (bits >>  8) & 0x000000ff;
        ret[3] =  bits        & 0x000000ff;

        return ret;
    };

    var setPos = function (pos) {
        var ret = new Array(3);
        var xsign = (pos.x < 0) ? 0x80 : 0,
            ysign = (pos.y < 0) ? 0x08 : 0,
            absx  = Math.abs(pos.x),
            absy  = Math.abs(pos.y);

        ret[0] = ((absx & 0x07F0) >> 4) | xsign;
        ret[1] = ((absx & 0x000F) << 4) | ysign | ((absy & 0x0700) >> 8);
        ret[2] = (absy & 0x00FF);
        return ret;
    };

    // this code is quoted from
    // http://qiita.com/k_ui/items/e6c1661158bd584a4209
    // canvasを利用して色情報をRGB値に変換する
    var canvas = document.createElement('canvas');
    canvas.width = 1; canvas.height = 1;
    var ctx = canvas.getContext('2d');

    var setCol = function (str) {
        ctx.fillStyle = str;
        ctx.fillRect(0, 0, 1, 1);

        var col = ctx.getImageData(0, 0, 1, 1).data;
        return [col[0], col[1], col[2]];
    };

    var getUint8 = function (){
        var b0=this._buf[this._offset];

        this._offset+=1;
        return b0;
    };

    var getUint16 = function (){
        var b1=this._buf[this._offset];
        var b0=this._buf[this._offset+1];

        this._offset+=2;
        return (b1 << 8) + b0;
    };

    var getStr = function (){
        var len = getUint8.call(this),
            value = '';
        for (var i = 0; i < len; i++) {
            var char1 = getUint16.call(this);

            if ((0xD800 <= char1) && (char1 <= 0xD8FF)) {
                var char2 = getUint16.call(this);
                    value += String.fromCharCode((char2 << 16) | char1)
            } else {
                    value += String.fromCharCode(char1);
            }
        }
        return value;
    };

    var getPos = function (buf, Offset) {
        var a = getUint8.call(this),
            b = getUint8.call(this),
            c = getUint8.call(this);

        var xsign = (a & 0x80) ? (-1) : 1;
        var ysign = (b & 0x08) ? (-1) : 1;

        return {x:xsign * (((a & 0x7F) << 4) | ((b & 0xF0) >> 4)),
                y:ysign * (((b & 0x07) << 8) | c)};
    };

    var getFloat32 = function () {
        var b0 = getUint8.call(this),
            b1 = getUint8.call(this),
            b2 = getUint8.call(this),
            b3 = getUint8.call(this);

        var sign = 1 - (2 * (b0 >> 7)),
            exponent = (((b0 << 1) & 0xff) | (b1 >> 7)) - 127,
            mantissa = ((b1 & 0x7f) << 16) | (b2 << 8) | b3;

        if (exponent === 128) {
            if (mantissa !== 0) {
                return NaN;
            } else {
                return sign * Infinity;
            }
        }

        if (exponent === -127) { // Denormalized
            return sign * mantissa * Math.pow(2, -126 - 23);
        }

        return sign * (1 + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent);
    };

    var getCol = function (buf, Offset) {
        var a = (getUint8.call(this)).toString(16),
            b = (getUint8.call(this)).toString(16),
            c = (getUint8.call(this)).toString(16),
            ret;

        ret = "#" + (a.length==1?("0"+a):a)
                  + (b.length==1?("0"+b):b)
                  + (c.length==1?("0"+c):c);
        return ret;
    }

var BBCQuery = function (bbobj, map) {
    // todo:入力値のチェックかな？
    this.bbobj=bbobj;
    this.map=map;
    this._buf=new Array();
    this._buf=this._buf.concat(setStr(map));
    this._offset=0;
};

BBCQuery.prototype = {
    setQueryString : function (str) {
        var data  = fromBase64(str);
        this._buf = RawDeflate.inflate(data);
        this.map  = getStr.call(this);
    },

    getQueryString : function () {
        var data=RawDeflate.deflate(this._buf);
        return toBase64(data);
    },

    setObjects : function () {
        var objs     = new Array();

        var obj,objtype,objname,objlen;
        while (this._offset < this._buf.length) {
            objlen  = getUint16.call(this);
            objname = getStr.call(this);
            objtype = getUint8.call(this);

            switch ( objtype ) {
            case 0x01:  //circle
                var color = getCol.call(this),
                    rad   = getUint16.call(this),
                    pos   = getPos.call(this);

                obj=bbobj.add_circle(objname, rad, color);
                obj._ptpos = getPos.call(this);
                obj.moveTo(pos.x, pos.y)
                  .redraw();
                break;

            case 0x02:  //line
                var color = getCol.call(this),
                    len   = getUint16.call(this),
                    pos   = getPos.call(this);

                obj=bbobj.add_line(objname, len, color);
                obj.moveTo(pos.x, pos.y);
                obj._pt1pos = getPos.call(this);
                obj._pt2pos = getPos.call(this);
                obj.redraw();
                break;

            case 0x03:  //freehand
                obj=bbobj.add_freehand();
                obj._step = getUint8.call(this);
                for (i=1;i<=obj._step;i++) {
                    obj._stepcol[i] = getCol.call(this);
                    var length = getUint16.call(this),
                        points = new Array();
                    for (j=0; j<length; j++) {
                         var point = getPos.call(this);
                         points.push([point.x, point.y]);
                    }
                    jc.line(points, obj._stepcol[i])
                      .layer(obj.id).id(i).lineStyle({lineWidth:3});
                }
                break;

            case 0x11:  //scout
                var color    = getCol.call(this),
                    rad      = getUint16.call(this),
                    len      = getUint16.call(this),
                    duration = getUint16.call(this),
                    pos      = getPos.call(this),
                    rotAngle = getFloat32.call(this);

                obj=bbobj.add_scout(objname, rad, len, duration, color);
                obj.moveTo(pos.x,pos.y)
                   .rotateTo(rotAngle)
                   .redraw();
                break;

            case 0x12:  //sensor
                var color = getCol.call(this),
                    rad   = getUint16.call(this),
                    pos   = getPos.call(this);

                obj=bbobj.add_sensor(objname, rad, color);
                obj.moveTo(pos.x, pos.y)
                   .redraw();
                break;

            case 0x13:  //radar
                var color = getCol.call(this),
                    rad   = getUint16.call(this),
                    angle = getUint16.call(this),
                    pos   = getPos.call(this),
                    rotAngle = getFloat32.call(this);

                obj=bbobj.add_radar(objname, rad, angle, color);
                obj.moveTo(pos.x, pos.y)
                   .rotateTo(rotAngle)
                   .redraw();
                break;

            case 0x21:  //howitzer
                var color   = getCol(view),
                    rad1    = getUint16.call(this),
                    rad2    = getUint16.call(this),
                    rad3    = getUint16.call(this),
                    pos     = getPos.call(this),
                    markpos = getPos.call(this);

                obj=bbobj.add_howitzer(objname, rad1, rad2, rad3, color);

                obj._markerx = markpos.x;
                obj._markery = markpos.y;

                obj.moveTo(pos.x, pos.y)
                   .redraw();
                break;

            case 0x22:  //bunker
                var color = getCol.call(this),
                    pos   = getPos.call(this);

                obj=bbobj.add_bunker(objname, color);
                obj.moveTo(pos.x, pos.y)
                   .redraw();
                break;

            default:
                obj=undefined;
                console.error("object not supported");
                view.seek(view.tell()+objlen-1);
                break;
            }
            if (obj === undefined) break;
            objs.push(obj);
        }
        return objs;
    },

    getObjects : function (objs) {
        for (var i=0;i<objs.length;i++) {
            var obj     = bbobj.object(objs[i]);
            var objdata = new Array();

            switch ( obj.type ) {
            case 'circle':
                objdata.unshift(0x01);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._radius));
                objdata = objdata.concat(setPos(obj.position()));
                objdata = objdata.concat(setPos(obj._ptpos));
                break;

            case 'line':
                objdata.unshift(0x02);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._length));
                objdata = objdata.concat(setPos(obj.position()));
                objdata = objdata.concat(setPos(obj._pt1pos));
                objdata = objdata.concat(setPos(obj._pt2pos));
                break;

            case 'freehand':
                objdata.unshift(0x03);
                objdata = objdata.concat(setInt8(obj._step));
                for (i=1;i<=obj._step;i++) {
                    objdata = objdata.concat(setCol(obj._stepcol[i]));
                    var points = jc("#" + i, {canvas:bbobj.id, layer:obj.id}).points();
                    objdata = objdata.concat(setInt16(points.length));
                    for (j=0; j<points.length; j++) {
                         objdata = objdata.concat(setPos({x:(points[j])[0],
                                                          y:(points[j])[1]}));
                    }
                }
                break;

            case 'scout':
                objdata.unshift(0x11);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._radius));
                objdata = objdata.concat(setInt16(obj._length));
                objdata = objdata.concat(setInt16(obj._duration));
                objdata = objdata.concat(setPos(obj.position()));
                objdata = objdata.concat(setFloat32(jc.layer(obj.id).getAngle()*180/Math.PI));
                break;

            case 'sensor':
                objdata.unshift(0x12);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._radius));
                objdata = objdata.concat(setPos(obj.position()));
                break;

            case 'radar':
                objdata.unshift(0x13);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._radius));
                objdata = objdata.concat(setInt16(obj._angle));
                objdata = objdata.concat(setPos(obj.position()));
                objdata = objdata.concat(setFloat32(jc.layer(obj.id).getAngle()*180/Math.PI));
                break;

            case 'howitzer':
                objdata.unshift(0x21);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._radius1));
                objdata = objdata.concat(setInt16(obj._radius2));
                objdata = objdata.concat(setInt16(obj._radius3));

                objdata = objdata.concat(setPos(obj.position()));
                objdata = objdata.concat(setPos({x:obj._markerx,
                                                 y:obj._markery}));
                break;

            case 'bunker':
                objdata.unshift(0x22);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setPos(obj.position()));
                break;

            default:
                objdata=undefined;
                console.error("object not supported");
                break;
            }
            if (objdata === undefined) break;
            objdata.unshift.apply(objdata, setStr(obj._text));
            objdata.unshift.apply(objdata, setInt16(objdata.length));
            this._buf = this._buf.concat(objdata);
        }
    }
};

global.BBCQuery = (global.module || {}).exports = BBCQuery;
if (typeof module !== 'undefined') {
	module.exports = BBCQuery;
}

})(this);