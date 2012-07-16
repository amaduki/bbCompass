(function (global) {
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

    var setCol = function (str) {
        var ret = new Array(3);
        if (str.search(/#[0-9a-fA-F]{6}/) == -1) return ("#000000") ;

        var r = parseInt(str.substr(1, 2),16),
            g = parseInt(str.substr(3, 2),16),
            b = parseInt(str.substr(5, 2),16);

        ret[0] = r;
        ret[1] = g;
        ret[2] = b;
        return ret;
    };

    var getStr = function (view) {
        var len = view.getUint8(),
            ret = view.getString(len);

        return ret;
    };

    var getPos = function (view) {
        var a = view.getUint8(),
            b = view.getUint8(),
            c = view.getUint8();

        var xsign = (a & 0x80) ? (-1) : 1;
        var ysign = (b & 0x08) ? (-1) : 1;

console.log(xsign * (((a & 0x7F) << 4) | ((b & 0xF0) >> 4)));
console.log(ysign * (((b & 0x07) << 8) | c));
        return {x:xsign * (((a & 0x7F) << 4) | ((b & 0xF0) >> 4)),
                y:ysign * (((b & 0x07) << 8) | c)};
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

    var setQueryString = function (bbobj, str, callback) {
        var objs     = new Array();
        var view     = jDataView.fromBase64(str);
        var map      = getStr(view);
        var dpm      = view.getFloat32();
        var imgscale = view.getFloat32();

        bbobj.setbg(map, dpm, imgscale, callback);

        var objtype,objname,objlen;
        while (view.tell() < view.byteLength) {
            objname = getStr(view);
            objlen  = view.getUint16();
            objtype = view.getUint8();

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
                obj.moveTo(pos.x, pos.y);
                obj._pt1pos = getPos(view);
                obj._pt2pos = getPos(view);
                obj.redraw();
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

            case 0x21:  //howitzer
                var color   = getCol(view),
                    rad1    = view.getUint16(),
                    rad2    = view.getUint16(),
                    rad3    = view.getUint16(),
                    pos     = getPos(view),
                    markpos = getPos(view);

                obj=bbobj.add_howitzer(objname, rad1, rad2, rad3, color);

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
                console.error("object not supported");
                view.seek(view.tell()+objlen-1);
                break;
            }
            if (obj === undefined) break;
            objs.push(obj);
        }

        return {map :map,
                objs:objs};
    }


    var getQueryString = function (bbobj, map, objs) {
        var data    = new Array();
        data = data.concat(setStr(map));
        data = data.concat(setFloat32(bbobj.scale/bbobj.imgscale));
        data = data.concat(setFloat32(bbobj.imgscale));
        for (var i=0;i<objs.length;i++) {
            var obj     = bbobj.object(objs[i]);
            var objdata = new Array();

            switch ( obj.type ) {
            case 'circle':
                objdata.unshift(0x01);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._radius));
                objdata = objdata.concat(setPos({x:jc.layer(obj.id)._transformdx,
                                                 y:jc.layer(obj.id)._transformdy}));
                objdata = objdata.concat(setPos(obj._ptpos));
                break;

            case 'line':
                objdata.unshift(0x02);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._length));
console.log("layer x: " + jc.layer(obj.id)._transformdx + "   y: " + jc.layer(obj.id)._transformdy);
                objdata = objdata.concat(setPos({x:jc.layer(obj.id)._transformdx,
                                                 y:jc.layer(obj.id)._transformdy}));
console.log("pt1 x: " + obj._pt1pos.x + "   y: " + obj._pt1pos.y);
console.log("pt2 x: " + obj._pt2pos.x + "   y: " + obj._pt2pos.y);
                objdata = objdata.concat(setPos(obj._pt1pos));
                objdata = objdata.concat(setPos(obj._pt2pos));
                break;

            case 'freehand':
                break;

            case 'scout':
                objdata.unshift(0x11);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._radius));
                objdata = objdata.concat(setInt16(obj._length));
                objdata = objdata.concat(setInt16(obj._duration));
                objdata = objdata.concat(setPos({x:jc.layer(obj.id)._transformdx,
                                                 y:jc.layer(obj.id)._transformdy}));
                objdata = objdata.concat(setFloat32(jc.layer(obj.id).getAngle()*180/Math.PI));
                break;

            case 'sensor':
                objdata.unshift(0x12);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._radius));
                objdata = objdata.concat(setPos({x:jc.layer(obj.id)._transformdx,
                                                 y:jc.layer(obj.id)._transformdy}));
                break;

            case 'radar':
                objdata.unshift(0x13);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._radius));
                objdata = objdata.concat(setInt16(obj._angle));
                objdata = objdata.concat(setPos({x:jc.layer(obj.id)._transformdx,
                                                 y:jc.layer(obj.id)._transformdy}));
                objdata = objdata.concat(setFloat32(jc.layer(obj.id).getAngle()*180/Math.PI));
                break;

            case 'howitzer':
                objdata.unshift(0x21);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setInt16(obj._radius1));
                objdata = objdata.concat(setInt16(obj._radius2));
                objdata = objdata.concat(setInt16(obj._radius3));

                objdata = objdata.concat(setPos({x:jc.layer(obj.id)._transformdx,
                                                 y:jc.layer(obj.id)._transformdy}));
                objdata = objdata.concat(setPos({x:obj._markerx,
                                                 y:obj._markery}));
                break;

            case 'bunker':
                objdata.unshift(0x22);
                objdata = objdata.concat(setCol(obj._color));
                objdata = objdata.concat(setPos({x:jc.layer(obj.id)._transformdx,
                                                 y:jc.layer(obj.id)._transformdy}));
                break;

            default:
                objdata=undefined;
                console.error("object not supported");
                break;
            }
            if (objdata === undefined) break;
            objdata.unshift.apply(objdata, setInt16(objdata.length));
            objdata.unshift.apply(objdata, setStr(obj._text));
            data = data.concat(objdata);
        }

        var buf  = jDataView.createBuffer.apply(undefined, data);
        var view = new jDataView(buf);
        console.log(view.toBase64());
        return view.toBase64();
    }

    global.BBQuery= {
        setQueryString:setQueryString,
        getQueryString:getQueryString
    };

})(this);