function(global) {
    var re_char_nonascii = /[^\x00-\x7F]/g;

    var sub_char_nonascii = function(m){
        var n = m.charCodeAt(0);
        return n < 0x800 ? String.fromCharCode(0xc0 | (n >>>  6))
                         + String.fromCharCode(0x80 | (n & 0x3f))
            :              String.fromCharCode(0xe0 | ((n >>> 12) & 0x0f))
                         + String.fromCharCode(0x80 | ((n >>>  6) & 0x3f))
                         + String.fromCharCode(0x80 |  (n         & 0x3f))
        ;
    };

    var setStr = function (text){
        var ret = Array();

        text.replace(re_char_nonascii, sub_char_nonascii);
        for (i=0;i<text.length;i++) {
            ret[i]=text.charCodeAt(i);
        }
        ret.unshift(ret.length);
        return ret;

    };

    var setInt8 = function (int){
        var ret = Array();
        ret[0] = int & 0x00ff
        return ret;
    };

    var setInt16 = function (int){
        var ret = Array();
        ret[0] = int & 0x00ff
        ret[1] = (int>>8) & 0x00ff
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
        var bits = floatToIntBits(f);

        ret[0] = (bits >> 24) & 0x000000ff;
        ret[1] = (bits >> 16) & 0x000000ff;
        ret[2] = (bits >>  8) & 0x000000ff;
        ret[3] =  bits        & 0x000000ff;

        return ret;
    };

    var setPos = function (x,y) {
        var ret = new Array(3);
        ret[0] = (x & 0x0FF0) >> 4;
        ret[1] = ((x & 0x000F) << 4) | ((y & 0xF000) >> 8);
        ret[2] = (y & 0x00FF);
        return ret;
    };

    var setCol = function (str) {
        var ret = new Array(3);
        if (str.search(/#[0-9a-fA-F]{6}/) == -1) return ("#000000") ;

        var r = parseInt(str.substr(1, 2),16),
            g = parseInt(str.substr(3, 2),16),
            b = parseInt(str.substr(5, 2),16);

        ret[0] = r;
        ret[1] = g;
        ret[2] = b;
    };

    var getStr = function (view) {
        var len = view.getUint8(),
            ret = view.getString(len),

        return ret;
    };

    var getPos = function (view) {
        var a = view.getUint8(),
            b = view.getUint8(),
            c = view.getUint8(),
            ret;

        ret.x = (a << 4) | ((b & 0xF0) >> 4);
        ret.y = ((b & 0x0F) << 8) | c;

        return ret;
    };

    var getCol = function (view) {
        var a = (view.getUint8()).toString(16),
            b = (view.getUint8()).toString(16),
            c = (view.getUint8()).toString(16),
            ret;

        ret = "#" + (a.length==1?("0"+a):a)
                  + (b.length==1?("0"+b):b)
                  + (c.length==1?("0"+c):c);
        return ret;
    }

    var setQueryString = function (bbobj, data, callback) {
        var objs     = new Array();
        var view     = new jDataView(data);
        var map      = getStr(view);
        var dpm      = view.getFloat32();
        var scale    = view.getFloat32();

        $("#map option:selected").val();

        bbobj.setbg(map, dpm, imgscale, callback);

        var objtype,objname,objlen;
        while (view.tell() < view.byteLength) {
            objlen  = view.getUint16();
            objtype = view.getUint8();
            objname = getStr(view);

            switch ( objtype ) {
            case 0x01:  //circle
                var color = getCol(view),
                    rad   = view.getUint16(),
                    pos   = getPos(view);

                obj=bbobj.add_circle(objname, rad, color);
                obj._ptpos = getPos(view);
                obj.moveTo(pos.x, pos.y)
                   .redraw();
                break;

            case 0x02:  //line
                var color = getCol(view),
                    len   = view.getUint16(),
                    pos   = getPos(view);

                obj=bbobj.add_line(objname, len, color);
                obj._pt1pos = getPos(view);
                obj._pt2pos = getPos(view);
                obj.moveTo(pos.x, pos.y)
                   .redraw();
                break;

            case 0x03:  //freehand
                console.log("freehandŽÀ‘•’†");
                break;

            case 0x11:  //scout
                var color    = getCol(view),
                    rad      = view.getUint16(),
                    len      = view.getUint16(),
                    duration = view.getUint16(),
                    pos      = getPos(view),
                    rotAngle = view.getFloat32();

                obj=bbobj.add_scout(objname, rad, len, duration, color);
                obj.moveTo(pos.x,pos.y)
                   .rotateTo(rotAngle)
                   .redraw();
                break;

            case 0x12:  //sensor
                var color = getCol(view),
                    rad   = view.getUint16(),
                    pos   = getPos(view);

                obj=bbobj.add_sensor(objname, rad, color);
                obj.moveTo(pos.x, pos.y)
                   .redraw();
                break;

            case 0x13:  //radar
                var color = getCol(view),
                    rad   = view.getUint16(),
                    angle = view.getUint16(),
                    pos   = getPos(view),
                    rotAngle = view.getFloat32();

                obj=bbobj.add_radar(objname, rad, angle, color);
                obj.moveTo(pos.x, pos.y)
                   .rotateTo(rotAngle)
                   .redraw();
                break;

            case 0x21:  //hewitzer
                var color   = getCol(view),
                    rad1    = view.getUint16(),
                    rad2    = view.getUint16(),
                    rad3    = view.getUint16(),
                    pos     = getPos(view),
                    markpos = getPos(view);

                obj=bbobj.add_hewitzer(objname, rad1, rad2, rad3, color);

                obj._markerx = markpos.x;
                obj._markery = markpos.y;

                obj.moveTo(pos.x, pos.y)
                   .redraw();
                break;

            case 0x22:  //bunker
                var color = getCol(view),
                    pos   = getPos(view);

                obj=bbobj.add_bunker(objname, color);
                obj.moveTo(pos.x, pos.y)
                   .redraw();
                break;

            default:
                obj=undefined;
                console.log("object not supported");
                view.seek(view.tell()+objlen);
                break;
            }
            if (obj !== undefined) objs.push(obj);
        }

        return {map :map,
                objs:objs};
    }


    var getQueryString = function (bbobj, map, objs) {
        var data    = new Array();
        data.concat(setStr(map));
        data.concat(setFloat32(bbobj.scale/bbobj.imgscale));
        data.concat(setFloat32(bbobj.imgscale));

        for (i=0;i<objs.length;i++) {
            var obj     = bbobj.object(objs[i]);
            var objdata = new Array();

            objdata.concat(setStr(obj._text));

            switch ( obj.type ) {
            case 'circle':
                objdata.unshift(0x01);
                objdata.concat(setCol(obj._color));
                objdata.concat(setInt16(obj._radius));
                objdata.concat(setPos({x:jc.layer(obj.id)._transformdx,
                                       y:jc.layer(obj.id)._transformdy}));
                objdata.concat(setPos(obj._ptpos));
                break;

            case 'line':
                break;

            case 'freehand':
                break;

            case 'scout':
                break;

            case 'sensor':
                break;

            case 'radar':
                break;

            case 'hewitzer':
                break;

            case 'bunker':
                break;

            default:
                console.log("object not supported");
                break;
            }
        }
    }

    global.BBQuery= {
        setQueryString:setQueryString,
        getQueryString:getQueryString
    };

}(this);