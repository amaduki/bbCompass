//
//jCanvaScriptへの関数、オブジェクト追加
//
{
    //回転処理用に関数一個追加
    jc.addFunction('rotateTo',
                   function (angle, x1, y1, duration, easing, onstep, fn) {
                       this.optns.rotateMatrix=[[1,0,0],[0,1,0]];
                       return this.rotate.apply(this, arguments);
                   });

    //現在の角度を求める関数を追加
    jc.addFunction('getAngle',
                   function () {
                       var matrix = this.optns.rotateMatrix;
                           return (matrix[1][0] > 0)?Math.acos(matrix[0][0])
                                                    :(-1) * Math.acos(matrix[0][0]);
                   });

    //CanvaSciprtに背景合成用のオブジェクト追加
    jc.addObject('imgdiff',
        {image:new Image,x:0,y:0,width:false,height:false,sx:0,sy:0,swidth:false,sheight:false},
        function (ctx) {
            if(this._width===false){
                this._width=this._image.width;
                this._height=this._image.height;
            }
            if(this._swidth===false){
                this._swidth=this._image.width;
                this._sheight=this._image.height;
            }

            var opmode = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation="lighter";
            ctx.drawImage(this._image,this._sx,this._sy,this._swidth,this._sheight,
                          this._x,this._y,this._width,this._height);
            ctx.globalCompositeOperation=opmode;
            this.getRect=function (type) {
                             return {x:this._x,y:this._y,width:this._width,height:this._height};
                         }
        });

    //CanvaSciprtに偵察機用オブジェクト追加
    jc.addObject('scout',
        {x:0, y:0, radius:0, length:0, color:'rgb(255, 0, 0)', fill:true},
        function(ctx) {
            var x=this._x,
                y=this._y,
                radius=this._radius,
                length=this._length;
            ctx.moveTo(x+length*0.5,y+radius);
            ctx.arc(x, y, radius, Math.PI * 0.5 , Math.PI * 1.5, false);
            ctx.lineTo(x+length*0.5,y-radius);
            ctx.arc(x+length, y, radius, Math.PI * 1.5 , Math.PI * 0.5, false);
            ctx.lineTo(x+length*0.5,y+radius);
            ctx.closePath();
            this.getRect=function () {
                             return {x:(this._x),
                                     y:(this._y),
                                     width:(this._length+this._radius*2),
                                     height:(this._radius*2)};
                         };
        });

    jc.addObject('scout_mask',
        {x:0, y:0, radius:0, length:0, color:'rgba(0, 0, 0, 0)', fill:true},
        function(ctx) {
            var x=this._x,
                y=this._y,
                radius=this._radius,
                length=this._length;
            ctx.moveTo(x+length*0.5,y+radius);
            ctx.arc(x, y, radius, Math.PI * 0.5 , Math.PI * 1.5, true);
            ctx.lineTo(x+length*0.5, y-radius);
            ctx.arc(x+length, y, radius, Math.PI * 1.5 , Math.PI * 0.5, false);
            ctx.lineTo(x+length*0.5,y+radius);
            ctx.closePath();
            this.getRect=function () {
                             return {x:(this._x),
                                     y:(this._y),
                                     width:(this._length+this._radius),
                                     height:(this._radius*2)};
                         };
        });

    //CanvaSciprtにレーダー用オブジェクト追加
    jc.addObject('radar',
        {x:0, y:0, radius:0, angle:0, color:'rgb(255, 0, 0)', fill:false},
        function(ctx) {
            var x      = this._x,
                y      = this._y,
                radius = this._radius,
                angle  = this._angle;
            var radian = angle * Math.PI / 180;

            ctx.moveTo(x, y);
            ctx.arc(x, y, radius, radian / 2 , radian / (-2), true);
            ctx.closePath();
            this.getRect=function () {
                             return {x:(this._x),
                                     y:(this._y),
                                     width:(this._radius),
                                     height:(2 * Math.sin(this._angle * Math.PI / 360))};
                         };
        });

    //CanvaSciprtに榴弾用クロスヘア追加
    jc.addObject('crosshair',
        {x:0, y:0, color:'rgb(255, 255, 255)'},
        function(ctx) {
            var offset=20; var dash=6;
            ctx.moveTo(this._x-offset,this._y);
            ctx.lineTo(this._x-offset+dash,this._y);
            ctx.closePath();
            ctx.moveTo(this._x-offset+dash*2,this._y);
            ctx.lineTo(this._x+offset-dash*2,this._y);
            ctx.closePath();
            ctx.moveTo(this._x+offset-dash,this._y);
            ctx.lineTo(this._x+offset,this._y);
            ctx.closePath();
            ctx.moveTo(this._x,this._y-offset);
            ctx.lineTo(this._x,this._y-offset+dash);
            ctx.closePath();
            ctx.moveTo(this._x,this._y-offset+dash*2);
            ctx.lineTo(this._x,this._y+offset-dash*2);
            ctx.closePath();
            ctx.moveTo(this._x,this._y+offset-dash);
            ctx.lineTo(this._x,this._y+offset);
            ctx.closePath();
            ctx.lineWidth=3;
            this.getRect=function () {
                             return {x:(this._x - offset),
                                     y:(this._y - offset),
                                     width:offset*2,
                                     height:offset*2};
                         };
        });
}


//
// BBオブジェクト定義
//
var BB = function (canvasID){
    this.member={};
    this.id=canvasID;
    this.jcanvas=jc.start(canvasID,true);
    this.scale=1;
    this.zoomScale=1;
    this.imgscale=1;
    var bbobj=this,
        jcanvas=this.jcanvas,
        canvas = document.getElementById(this.id);

    this.touchToMouse(canvas);

  //
  //BB_baseオブジェクト
  //
    this.BB_base = function () {
        //初期化は下位オブジェに任せる
        this._text="base";
        this._color="#000000";
    };

    this.BB_base.prototype.draw = function () {
        //一応ダミーを定義
    };

    this.BB_base.prototype.redraw = function () {
        jcanvas.layer(this.id).objects().del();
        this.draw();
    };

    this.BB_base.prototype.applyZoom = function (scale, _x, _y) {
        var posx = jc.layer(this.id)._transformdx,
            posy = jc.layer(this.id)._transformdy;
        jc.layer(this.id).translate(posx*scale-posx-_x*scale, posy*scale-posy-_y*scale);
        this.redraw();
    };

    this.BB_base.prototype.toString = function() {
        return this.id;
    };

    this.BB_base.prototype.position = function () {
        var posx = jcanvas.layer(this.id)._transformdx;
        var posy = jcanvas.layer(this.id)._transformdy;
        return {x:posx, y:posy};
    };

    this.BB_base.prototype.click = function(fn) {
        jcanvas.layer(this.id).click(fn);
        return this;
    };

    this.BB_base.prototype.mouseup = function(fn) {
        jcanvas.layer(this.id).mouseup(fn);
        return this;
    };

    this.BB_base.prototype.mousedown = function(fn) {
        jcanvas.layer(this.id).mousedown(fn);
        return this;
    };

    this.BB_base.prototype.dblclick = function(fn) {
        jcanvas.layer(this.id).dblclick(fn);
        return this;
    };

    this.BB_base.prototype.move = function (_dx,_dy) {
        jcanvas.layer(this.id).translate(_dx,_dy);
        return this;
    };

    this.BB_base.prototype.moveTo = function (_x,_y) {
        //translateToはどこが原点かわからないので、
        //現在までの変位をもとに相対的に移動させる
        var posx = jcanvas.layer(this.id)._transformdx;
        var posy = jcanvas.layer(this.id)._transformdy;
        jcanvas.layer(this.id).translate(_x-posx,_y-posy);
        return this;
    };

    this.BB_base.prototype.color = function (_color) {
        if (_color === undefined) {return this._color;}
        this._color=_color;
        this.redraw();
        return this;
    };

    this.BB_base.prototype.text = function (_text) {
        if (_text === undefined) {return this._text;}
        this._text=_text;
        this.redraw();
        return this;
    };

    this.BB_base.prototype.regist = function () {
        bbobj.member[this.id]=this;
    }

    this.BB_base.prototype.up = function () {
        var level=jcanvas.layer(this.id).level();
        var nextobj = bbobj.nextlevel(level);

        if (nextobj["id"] !== undefined) {
            jcanvas.layer(nextobj["id"]).level(level);
            jcanvas.layer(this.id).level(nextobj["level"]);
            return true;
        } else {
            return false;
        }
    };

    this.BB_base.prototype.down = function () {
        var level=jcanvas.layer(this.id).level();
        var prevobj = bbobj.prevlevel(level);

        if (prevobj["id"] !== undefined) {
            jcanvas.layer(prevobj["id"]).level(level);
            jcanvas.layer(this.id).level(prevobj["level"]);
            return true;
        } else {
            return false;
        }
    };

    this.BB_base.prototype.del = function () {
        delete bbobj.member[this.id];
        jcanvas.layer(this.id).del();
    };

  //
  //BB_circleオブジェクト
  //
    this.BB_circle = function (_text, _radius, _color) {
        if (_color===undefined) {_color='rgb(0, 51, 255)';}
        this.id=UUID.genV1().toString();

        this.type="circle";
        this._text=_text;
        this._radius=_radius;
        this._color=_color;

        var px_rad = bbobj.meter_to_pixel(this._radius);
        this._ptpos={x:px_rad, y:0};
        this.move(px_rad, px_rad);

        this.draw();
        this.regist();
    };
    this.BB_circle.prototype=new this.BB_base();

    this.BB_circle.prototype.draw = function () {
        var px_rad = bbobj.meter_to_pixel(this._radius),
            ptx    = this._ptpos.x,
            pty    = this._ptpos.y,
            obj    = this;

        var area    = jcanvas.circle(0, 0, px_rad, this._color, true).opacity(0.3).layer(this.id),
            areacol = jcanvas.circle(0, 0, px_rad, this._color, false)
                             .opacity(1).lineStyle({lineWidth:3}).layer(this.id),
            line    = jcanvas.line({points:[[0, 0], [ptx, pty]], color:this._color})
                             .lineStyle({lineWidth:3}).layer(this.id).opacity(1);
        jcanvas.circle(0, 0, 7, this._color, true).opacity(1).layer(this.id);

        var center = jcanvas.circle(0, 0, 5, "#FFFFFF", true).layer(this.id);
        jcanvas.text(this._text, 0, -10)
               .layer(this.id).color('#FFFFFF').font('15px sans-serif').align('center');

        var ptcol  = jcanvas.circle(ptx, pty, 7, this._color, true).layer(this.id).opacity(1),
            pt     = jcanvas.circle(ptx, pty, 5, "#FFFFFF", true).layer(this.id);
            radius = jcanvas.text(Math.floor(this._radius)+"m", ptx/2, pty/2).baseline("top")
                            .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id);
        jcanvas.layer(this.id).draggable();

        var txtheight= radius.getRect().height;  //translateTo時に高さがずれるので補正項
        var callback = function () {
                           var pos1=center.position(),pos2=pt.position(),
                               dx=pos2.x-pos1.x, dy=pos2.y-pos1.y,
                               centerx=(pos1.x+pos2.x)/2, centery=(pos1.y+pos2.y)/2,
                               newrad = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));
                           ptcol.translateTo(pos2.x, pos2.y);
                           line.points([[0, 0],
                                        [pt._x+pt._transformdx, pt._y+pt._transformdy]]);
                           area.attr('radius',newrad);
                           areacol.attr('radius',newrad);
                           radius.translateTo(centerx, centery-txtheight)
                                 .string(Math.floor(bbobj.pixel_to_meter(newrad))+"m");
                           obj._radius = bbobj.pixel_to_meter(newrad);
                           obj._ptpos  = {x:pt._x+pt._transformdx, y:pt._y+pt._transformdy};
                       };

        pt.draggable(callback);
        pt.optns.drag.val=false;
        pt.mouseover(function () {
                        jcanvas.layer(obj.id).optns.drag.val=false;
                        pt.optns.drag.val=true;
                     });
        pt.mouseout(function () {
                        jcanvas.layer(obj.id).optns.drag.val=true;
                        pt.optns.drag.val=false;
                    });
        return this;
    };

    this.BB_circle.prototype.applyZoom = function (scale, _x, _y) {
        this._ptpos.x = this._ptpos.x * scale;
        this._ptpos.y = this._ptpos.y * scale;
        bbobj.BB_base.prototype.applyZoom.apply(this, arguments);
        return this;
    };

  //
  //BB_lineオブジェクト
  //
    this.BB_line = function (_text, _length, _color) {
        if (_color===undefined) {_color='rgb(51, 153, 0)';}
        this.id=UUID.genV1().toString();

        this.type="line";
        this._text=_text;
        this._length=_length;
        this._color=_color;

        var px_len = bbobj.meter_to_pixel(this._length)
        this._pt1pos={x:(-1)*px_len/2, y:0};
        this._pt2pos={x:px_len/2, y:0};

        this.draw();
        this.move(100+px_len/2, 100);
        this.regist();
    };
    this.BB_line.prototype=new this.BB_base();

    //座標の扱いが特殊なので座標関連の関数を一部オーバーライド
    this.BB_line.prototype.position = function () {
        var _x = (this._pt1pos.x + this._pt2pos.x)/2,
            _y = (this._pt1pos.y + this._pt2pos.y)/2;
        return {x:_x, y:_y};
    };

    this.BB_line.prototype.moveTo = function (_x,_y) {
        var layer=jcanvas.layer(this.id);
        var _curx = layer._transformdx+(this._pt1pos.x + this._pt2pos.x)/2,
            _cury = layer._transformdy+(this._pt1pos.y + this._pt2pos.y)/2;
        layer.translate(_x-_curx, _y-_cury);
        return this;
    };

    this.BB_line.prototype.draw = function () {
        var above  = 15,
            below  = 5,
            x1=this._pt1pos.x, y1=this._pt1pos.y
            x2=this._pt2pos.x, y2=this._pt2pos.y
            obj    = this;
        var centerx=(x1+x2)/2, centery=(y1+y2)/2;

        var line     = jcanvas.line({points:[[x1, y1], [x2, y2]], color:this._color})
                              .opacity(1).lineStyle({lineWidth:3}).layer(this.id),
            pt1col   = jcanvas.circle(x1, y1, 7, this._color, true).layer(this.id),
            pt1      = jcanvas.circle(x1, y1, 5, "#FFFFFF", true).layer(this.id),
            pt2col   = jcanvas.circle(x2, y2, 7, this._color, true).layer(this.id),
            pt2      = jcanvas.circle(x2, y2, 5, "#FFFFFF", true).layer(this.id);
            linename = jcanvas.text(this._text, centerx, centery+above)
                              .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id),
            linelen  = jcanvas.text(Math.floor(this._length)+"m", centerx, centery-below)
                              .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id);
        jcanvas.layer(this.id).draggable();
        
        var txtheight= linelen.getRect().height;  //translateTo時に高さがずれるので補正項
        var callback = function () {
                           var pos1=pt1.position(), pos2=pt2.position(),
                               dx=pos2.x-pos1.x, dy=pos2.y-pos1.y,
                               centerx=(pos1.x+pos2.x)/2, centery=(pos1.y+pos2.y)/2,
                               newlen = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));
                           pt1col.translateTo(pos1.x, pos1.y);
                           pt2col.translateTo(pos2.x, pos2.y);
                           line.points([[pt1._x+pt1._transformdx, pt1._y+pt1._transformdy],
                                        [pt2._x+pt2._transformdx, pt2._y+pt2._transformdy]]);
                           linename.translateTo(centerx, centery+above-txtheight);
                           linelen.translateTo(centerx, centery-below-txtheight)
                                  .string(Math.floor(bbobj.pixel_to_meter(newlen))+"m");
                           obj._length = bbobj.pixel_to_meter(newlen);
                           obj._pt1pos={x:pt1._x+pt1._transformdx ,y:pt1._y+pt1._transformdy};
                           obj._pt2pos={x:pt2._x+pt2._transformdx ,y:pt2._y+pt2._transformdy};
                       };
        pt1.draggable(callback);
        pt1.optns.drag.val=false;
        pt2.draggable(callback);
        pt2.optns.drag.val=false;
        pt1.mouseover(function () {
                          jcanvas.layer(obj.id).optns.drag.val=false;
                          pt1.optns.drag.val=true;
                      });
        pt1.mouseout(function () {
                        jcanvas.layer(obj.id).optns.drag.val=true;
                        pt1.optns.drag.val=false;
                     });
        pt2.mouseover(function () {
                          jcanvas.layer(obj.id).optns.drag.val=false;
                          pt2.optns.drag.val=true;
                     });
        pt2.mouseout(function () {
                         jcanvas.layer(obj.id).optns.drag.val=true;
                         pt2.optns.drag.val=false;
                     });
        return this;
    };

    this.BB_line.prototype.applyZoom = function (scale, _x, _y) {
        this._pt1pos.x = this._pt1pos.x * scale;
        this._pt1pos.y = this._pt1pos.y * scale;
        this._pt2pos.x = this._pt2pos.x * scale;
        this._pt2pos.y = this._pt2pos.y * scale;
        bbobj.BB_base.prototype.applyZoom.apply(this, arguments);
        return this;
    };

  //
  //BB_scoutオブジェクト
  //
    this.BB_scout = function (_text, _radius, _length, _duration, _color) {
        if (_color===undefined) {_color='rgb(255, 0, 0)';}
        this.id=UUID.genV1().toString();

        this.type="scout";
        this._text=_text;
        this._radius=_radius;
        this._length=_length;
        this._duration=_duration;
        this._color=_color;
        //描画して登録。初期座標は偵察半径分ずらす
        this.draw();
        var px_rad  = bbobj.meter_to_pixel(this._radius);
        this.move(px_rad, px_rad);
        this.regist();
    };
    this.BB_scout.prototype=new this.BB_base();

    this.BB_scout.prototype.draw = function () {
        var px_rad  = bbobj.meter_to_pixel(this._radius),
            px_len  = bbobj.meter_to_pixel(this._length),
            obj     = this;

        var frame = jcanvas.circle(0, 0, px_rad, this._color, false).layer(this.id).opacity(1),
            scout = jcanvas.circle(0, 0, px_rad, this._color, true).opacity(0.3).layer(this.id),
            area  = jcanvas.scout(0, 0, px_rad, px_len, this._color).opacity(0.2).layer(this.id),
            mask  = jcanvas.scout_mask(0, 0, px_rad, px_len).layer(this.id);
        jcanvas.circle(0, 0, 3, '#FFFFFF', true).layer(this.id);
        jcanvas.text(this._text, 0, -10)
               .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id);
        jcanvas.layer(this.id).draggable();
        

        //角度変更処理
        mask.mousedown(function(point){
                           var pos_sct  = scout.position();
                           var startrad = Math.atan2((point.y-pos_sct.y), (point.x-pos_sct.x)),
                               baserad  = jcanvas.layer(obj.id).getAngle();
                           mask.mousemove(function (pos) {
                                              var nowrad = Math.atan2((pos.y-pos_sct.y), (pos.x-pos_sct.x));
                                              var rad    = baserad + (nowrad - startrad);
                                              jcanvas.layer(obj.id).rotateTo((rad*180/Math.PI), 0, 0);
                                          });
                       });
        mask.mouseup(function (point) {
                            mask.mousemove(function () {});
                       });

        mask.mouseover(function () {
                           jcanvas.layer(obj.id).optns.drag.val=false;  // ドラッグ無効
                       });
        mask.mouseout(function () {
                          jcanvas.layer(obj.id).optns.drag.val=true;    // ドラッグ有効
                      });

        //偵察機のアニメーション
        mask.dblclick(function () {
                          //durationの単位はミリ秒のはずだが誤差がある…？
                          scout.translate(px_len,0,
                                          obj._duration*1000,
                                          undefined,
                                          {fn:function () {
                                                  frame.animate({x:scout._transformdx,
                                                                 y:scout._transformdy});
                                              }
                                          },
                                          function () {
                                              obj.redraw();
                                          });
                          return false;
        });
        return this;
    };

  //
  //BB_sensorオブジェクト
  //
    this.BB_sensor = function (_text, _radius, _color) {
        if (_color===undefined) {_color='rgb(255, 0, 0)';}
        this.id=UUID.genV1().toString();

        this.type="sensor";
        this._text=_text;
        this._radius=_radius;
        this._color=_color;
        //描画して登録。初期座標は偵察半径分ずらす
        this.draw();
        var px_rad = bbobj.meter_to_pixel(this._radius);
        this.move(px_rad, px_rad);
        this.regist();
    };
    this.BB_sensor.prototype=new this.BB_base();

    this.BB_sensor.prototype.draw = function () {
        var px_rad = bbobj.meter_to_pixel(this._radius);
        jcanvas.circle(0, 0, px_rad, this._color, false).opacity(1).layer(this.id);
        jcanvas.circle(0, 0, px_rad, this._color, true).opacity(0.5).layer(this.id);
        jcanvas.circle(0, 0, 3, this._color, true).layer(this.id).color('#FFFFFF');
        jcanvas.text(this._text, 0, -10)
               .align('center').layer(this.id).color('#FFFFFF').font('15px sans-serif');
        jcanvas.layer(this.id).draggable();
        return this;
    };

  //
  //BB_radarオブジェクト
  //
    this.BB_radar = function (_text, _radius, _angle, _color) {
        if (_color===undefined) {_color='rgb(255, 0, 0)';}
        this.id=UUID.genV1().toString();

        this.type="radar";
        this._text=_text;
        this._radius=_radius;
        this._angle=_angle;
        this._color=_color;
        //描画して登録。初期座標は偵察半径分ずらす
        this.draw();
        var px_rad = bbobj.meter_to_pixel(this._radius);
        this.move(px_rad, px_rad);
        this.regist();
    };
    this.BB_radar.prototype=new this.BB_base();

    this.BB_radar.prototype.draw = function () {
        var px_rad = bbobj.meter_to_pixel(this._radius),
            obj    = this;

        jcanvas.radar(0, 0, px_rad, this._angle, this._color, false).opacity(1).layer(this.id);
        var area = jcanvas.radar(0, 0, px_rad, this._angle, this._color, true).opacity(0.5).layer(this.id);
        jcanvas.circle(0, 0, 3, this._color, true).layer(this.id).color('#FFFFFF');
        var text = jcanvas.text(this._text, 60, 0)
                   .align('center').layer(this.id).color('#FFFFFF').font('15px sans-serif');

        //移動処理(draggableでは回転できないため、独自定義)
        var baserad, startrad, radius;
        var mmEvent = function (pos) {
                          var pos_area = area.position(),
                              nowrad   = Math.atan2((pos.y-pos_area.y), (pos.x-pos_area.x)),
                              rad      = baserad+(nowrad - startrad);
                           jcanvas.layer(obj.id).rotateTo((rad*180/Math.PI), 0, 0);
                           obj.moveTo(pos.x-radius*Math.cos(nowrad), pos.y-radius*Math.sin(nowrad));};

        var mdEvent = function(point){
                          var pos_base = area.position(),
                              px_rad   = bbobj.meter_to_pixel(obj._radius);
                          radius   = Math.sqrt(Math.pow((point.x-pos_base.x),2) + Math.pow((point.y-pos_base.y),2));
                          startrad = Math.atan2((point.y-pos_base.y), (point.x-pos_base.x));
                          baserad  = jcanvas.layer(obj.id).getAngle();
                          area.mousemove(mmEvent);
                          text.mousemove(mmEvent);};

        var muEvent = function(){
                           area.mousemove(function () {});
                           text.mousemove(function () {});};

        area.mousedown(mdEvent);
        text.mousedown(mdEvent);
        area.mouseup(muEvent);
        text.mouseup(muEvent);

        return this;
    };

  //
  //BB_hewitzerオブジェクト
  //
    this.BB_howitzer = function (_text, _radius1, _radius2, _radius3, _color) {
        if (_color===undefined) {_color='#FFA500';}
        this.id=UUID.genV1().toString();

        this.type="hewitzer";
        this._text=_text;
        this._radius1=_radius1;
        this._radius2=_radius2;
        this._radius3=_radius3;
        this._color=_color;
        this._markerx=0;
        this._markery=0;
        //描画して登録。初期座標は有効射程分ずらす
        this.draw();
        var px_rad1 = bbobj.meter_to_pixel(this._radius1);
        this.move(px_rad1, px_rad1);
        this.regist();
    };
    this.BB_howitzer.prototype=new this.BB_base();

    this.BB_howitzer.prototype.draw = function () {
        var px_rad1 = bbobj.meter_to_pixel(this._radius1),
            px_rad2 = bbobj.meter_to_pixel(this._radius2),
            px_rad3 = bbobj.meter_to_pixel(this._radius3)+px_rad2,
            obj     = this;

        jcanvas.circle(0, 0, px_rad1, this._color, false).opacity(1).layer(this.id);
        var range   = jcanvas.circle(0, 0, px_rad1, this._color, true).opacity(0.2).layer(this.id),
            area    = jcanvas.circle(this._markerx, this._markery, px_rad3, this._color, false).opacity(1).layer(this.id),
            tgtline = jcanvas.circle(this._markerx, this._markery, px_rad2, this._color, false).opacity(1).layer(this.id),
            cross   = jcanvas.crosshair(this._markerx, this._markery).layer(this.id),
            tgt     = jcanvas.circle(this._markerx, this._markery, px_rad2, this._color, true).opacity(0.3).layer(this.id);
        jcanvas.circle(0, 0, 3, '#FFFFFF', true).layer(this.id);
        jcanvas.text(this._text, 0, -40)
               .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id);
        jcanvas.layer(this.id).draggable();

        //砲撃地点の処理
        tgt.draggable(function (cursor) {
                                var followflag = true,
                                    pos   = tgt.position(),
                                    base  = range.position(),
                                    layer = jcanvas.layer(obj.id),
                                    dx    = cursor.x-base.x,
                                    dy    = cursor.y-base.y;
                                if (Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)) > px_rad1) {
                                    //はみだし禁止！
                                    followflag=false;
                                } else {
                                    followflag=true;
                                }

                                if (followflag) {
                                    tgtline.translateTo(pos.x,pos.y);
                                    cross.translateTo(pos.x,pos.y);
                                    area.translateTo(pos.x,pos.y);
                                } else {
                                    var rad = Math.atan2((cursor.y-base.y),(cursor.x-base.x));
                                    var x = base.x+px_rad1*Math.cos(rad);
                                    var y = base.y+px_rad1*Math.sin(rad);
                                    tgt.translateTo(x,y);
                                    tgt.translateTo(x,y);
                                    tgtline.translateTo(x,y);
                                    cross.translateTo(x,y);
                                    area.translateTo(x,y);
                                }
                                obj._markerx=area._x+area._transformdx;
                                obj._markery=area._y+area._transformdy;
                            });

        //初期状態ではレイヤを優先するため、個別ドラッグを抑止。
        //ターゲット部分でボタンが押下された場合のみターゲットの個別ドラッグを有効化。
        tgt.optns.drag.val=false;
        tgt.mouseover(function () {
                        jcanvas.layer(obj.id).optns.drag.val=false;
                        tgt.optns.drag.val=true;
                    });
        tgt.mouseout(function () {
                       jcanvas.layer(obj.id).optns.drag.val=true;
                       tgt.optns.drag.val=false;
                   });

        tgt.dblclick(function () {
                        // 最初の位置に戻す
                        var base  = range.position();
                        tgt.translateTo(base.x,base.y);
                        tgtline.translateTo(base.x,base.y);
                        cross.translateTo(base.x,base.y);
                        area.translateTo(base.x,base.y);
                        obj._markerx=area._x+area._transformdx;
                        obj._markery=area._y+area._transformdy;
                        return false;
                    });

        return this;
    };

    this.BB_howitzer.prototype.applyZoom = function (scale, _x, _y) {
        this._markerx = this._markerx * scale;
        this._markery = this._markery * scale;
        bbobj.BB_base.prototype.applyZoom.apply(this, arguments);
        return this;
    };

  //
  //BB_freehandオブジェクト
  //
    this.BB_freehand = function ( _color) {
        if (_color===undefined) {_color='rgb(255, 255, 255)';}
        this.id=UUID.genV1().toString();
        this.type    = "freehand";
        this._color  = _color;
        this._step   = 0;
        this._stepcol= new Array;
        this._hooker = undefined;

        //layerを確保するためのダミー画像を設置するのみ
        jcanvas.rect(0, 0, 1, 1, 'rgba(0, 0, 0, 0)').layer(this.id);
        this.regist();
    };

    this.BB_freehand.prototype.color = function (_color) {
        if (_color === undefined) {return this._color;}
        this._color=_color;
        return this;
    };

    //BB_baseからプロトタイプをコピー
    this.BB_freehand.prototype.toString = this.BB_base.prototype.toString;
    this.BB_freehand.prototype.regist   = this.BB_base.prototype.regist;
    this.BB_freehand.prototype.up       = this.BB_base.prototype.up;
    this.BB_freehand.prototype.down     = this.BB_base.prototype.down;
    this.BB_freehand.prototype.del      = this.BB_base.prototype.del;

    this.BB_freehand.prototype.redraw = function () {
        for (i=1;i<=this._step;i++) {
            var points = jc("#" + i, {canvas:bbobj.id, layer:this.id}).points();
            jc("#" + i, {canvas:bbobj.id, layer:this.id}).del();
            jcanvas.line(points, this._stepcol[i])
                   .layer(this.id).id(i).lineStyle({lineWidth:3});
        }
    }

    this.BB_freehand.prototype.applyZoom = function (scale, _x, _y) {
        var posx = jc.layer(this.id)._transformdx,
            posy = jc.layer(this.id)._transformdy;
        jc.layer(this.id).translate(posx*scale-posx-_x*scale, posy*scale-posy-_y*scale);

        for (i=1;i<=this._step;i++) {
            var points = jc("#" + i, {canvas:bbobj.id, layer:this.id}).points();
            for (j=0; j<points.length; j++) {
                points[j] = [(points[j])[0]*scale, (points[j])[1]*scale];
            }
            jc("#" + i, {canvas:bbobj.id, layer:this.id}).del();
            jcanvas.line(points, this._stepcol[i])
                   .layer(this.id).id(i).lineStyle({lineWidth:3});
        }
    }

    this.BB_freehand.prototype.start = function () {
        var obj    = this,
            layer  = jcanvas.layer(this.id),
            canvas = jc.canvas(bbobj.id);

        if (this._hooker !== undefined) return;

        // マウスイベントフック用の四角形を最前面に展開
        this._hooker=UUID.genV1().toString();
        var hooker = jcanvas.rect(0, 0, canvas.width(), canvas.height(), 'rgba(0, 0, 0, 0)')
                            .layer(this._hooker).level('top');

        hooker.click(function () {return false;});
        hooker.dblclick(function () {return false;});
        hooker.mousemove(function () {return false;});
        hooker.mousedown(function (ptstart) {
                             obj._step++;
                             obj._stepcol[obj._step]=obj._color;
                             var line = jcanvas.line([[ptstart.x,ptstart.y],[ptstart.x,ptstart.y]],obj._color)
                                               .layer(obj.id).id(obj._step).lineStyle({lineWidth:3});
                             hooker.mousemove(function (point) {
                                                       line.addPoint(point.x,point.y);
                                                       return false;
                                                   });
                             return false;
                         });

        hooker.mouseup(function () {
                           hooker.mousemove(function () {});
                           return false;
                       });

        return this;
    };

    this.BB_freehand.prototype.undo = function () {
        if (this._step != 0) {
            jc("#" + this._step, {canvas:bbobj.id, layer:this.id}).del();
            this._step--;
        }
        return this;
    };

    this.BB_freehand.prototype.end = function() {
        // イベントフック用の四角形を消す
        (jc.layer(this._hooker)).del();
        this._hooker = undefined;
        return this;
    };
};

//
// touchイベントからmouseイベントへのブリッジを設定
//
BB.prototype.touchToMouse = function(canvas) {
    var clickthr=5;  // クリックとみなす範囲の閾値

    var touchid=0,mouseoverflag=false,touchflag=false,dblclkflag=0,startX=0,startY=0;
    var bbobj=this;

    function getTouch (ev){
        var touch;
        switch (ev.type) {
            case "touchstart":
                touch   = ev.touches[0];
                touchid = touch.identifier;
                touchx=touch.clientX;touchy=touch.clientY;
                break
            case "touchmove":
                for (i=0;i<ev.changedTouches.length;i++) {
                    if (ev.changedTouches[i].identifier == touchid) {
                        touch=ev.changedTouches[i];
                        break;
                    }
                }
                break;
            case "touchend":
                for (i=0;i<ev.changedTouches.length;i++) {
                    if (ev.changedTouches[i].identifier == touchid) {
                        touch=ev.changedTouches[i];
                        break;
                    }
                }
                break;
        }

        if (touch===undefined) {
                return false;
        }
        return touch;
    }

    function dispatchMouseEvent(type, touch) {
        var event = document.createEvent("MouseEvent"); 
            event.initMouseEvent(type, true, true, window,
                                 ((type == 'dblclick')?2:1),
                                 touch.screenX, touch.screenY,
                                 touch.clientX, touch.clientY, 
                                 false, false, false, false, 0, null); 
        touch.target.dispatchEvent(event); 
    };

    function pointInObj(touch) {
        var cnvrect = jc.canvas(bbobj.id).cnv.getBoundingClientRect();
        var x = touch.clientX-cnvrect.left,
            y = touch.clientY-cnvrect.top,
            result = false;

        for (var objid in (bbobj.member)) {
            if ((bbobj.object(objid)).type != "freehand") {
                result = jc.layer(objid).isPointIn(x,y);
            } else {
                //freehandオブジェクトは書き込み中であればオブジェクトありとみなす
                result = ((bbobj.object(objid))._hooker !== undefined);
            }
            if (result) {break;}
        }
        return result;
    }

    canvas.addEventListener('touchstart',
                            function(e){
                                var touch=getTouch(e);
                                touchflag=pointInObj(touch);
                                if (! touchflag) return;
                                e.preventDefault();
                                mouseoverflag=true;

                                //前回タッチからの距離が閾値を超えていたらダブルクリック判定を外す
                                if (dblclkflag && (Math.abs(startX - touch.clientX)>clickthr
                                                   || Math.abs(startY - touch.clientY)>clickthr)) {
                                    clearTimeout(dblclkflag);
                                    dblclkflag=0;
                                }
                                startX=touch.clientX;
                                startY=touch.clientY;
                                dispatchMouseEvent('mousemove',touch);
                                jc.canvas(BB.id).frame();
                                dispatchMouseEvent('mousedown',touch);
                                return false;},
                            false);

    canvas.addEventListener('touchmove',
                            function(e){
                                if (! touchflag) return;
                                var touch=getTouch(e);
                                e.preventDefault();

                                var cnvrect = e.target.getBoundingClientRect();
                                var cnvx    = cnvrect.left,
                                    cnvy    = cnvrect.top,
                                    width   = e.target.offsetWidth||e.target.width,
                                    height  = e.target.offsetHeight||e.target.height;

                                //canvasの枠内ならmousemove、枠外ならmouseout
                                if (touch.clientX > cnvx && touch.clientY > cnvy
                                    && touch.clientX < cnvx+width && touch.clientY < cnvy+height) {
                                    if (! mouseoverflag) dispatchMouseEvent('mouseover',touch);
                                    dispatchMouseEvent('mousemove',touch);
                                    mouseoverflag=true;
                                } else {
                                    if (mouseoverflag) dispatchMouseEvent('mouseout',touch);
                                    mouseoverflag=false;
                                }},
                            false);

    canvas.addEventListener('touchend',
                            function(e){
                                //touch処理中でなければpreventDefaultせずに抜ける
                                if (! touchflag) return;
                                e.preventDefault();

                                //mouseout時はpreventDefaultしてから抜ける
                                if (! mouseoverflag) return;
                                var touch=getTouch(e);
                                dispatchMouseEvent('mouseup',touch);
                                //タッチ開始からの距離が閾値以下ならクリック扱い
                                if (Math.abs(startX - touch.clientX)<clickthr
                                    && Math.abs(startY - touch.clientY)<clickthr) {
                                    if (dblclkflag) {
                                        dispatchMouseEvent('click',touch)
                                        dispatchMouseEvent('dblclick',touch)
                                        clearTimeout(dblclkflag);
                                        dblclkflag=0;
                                    } else {
                                        dispatchMouseEvent('click',touch)
                                        dblclkflag=setTimeout(function(){dblclkflag=0},500);
                                        startX=touch.clientX;
                                        startY=touch.clientY;
                                    }
                                }
                                mouseoverflag=false;},
                            false);

}

//
//縮尺計算
//
BB.prototype.meter_to_pixel = function(meter) {
    return(meter*(this.scale*this.zoomScale));
};

BB.prototype.pixel_to_meter = function(pixel) {
    return(pixel/(this.scale*this.zoomScale));
};

//
//背景
//(画像ファイル, Dot per Meter, 画像縮小比率)
//
BB.prototype.setbg = function(file, dpm, imgscale) {
    var image   = new Image;
    var jcanvas = this.jcanvas;
    var id      = this.id;
    if (imgscale===undefined) {imgscale=1;};

    image.src=file;
    image.onload=function() {
        var canvas = document.getElementById(id);
        canvas.width  = image.width*imgscale;
        canvas.height = image.height*imgscale;
        jc.clear(id);
        jcanvas.image(image,0,0,image.width*imgscale,image.height*imgscale).level(-1).id("bg");
        jc.start(id,true);
    };
    this.scale=dpm*imgscale;
    this.imgscale=imgscale;
    this.member={};
};

BB.prototype.setbgdiff = function(file) {
    var image    = new Image;
    var jcanvas  = this.jcanvas;
    var id       = this.id;
    var imgscale = this.imgscale;

    if (file) {
        //ファイル指定があれば差分を再表示
        image.src=file;
        image.onload=function() {
            jcanvas("#bgdiff").del();
            jcanvas.imgdiff(image,0,0,image.width*imgscale,image.height*imgscale)
                   .level(0).id("bgdiff");
        jc.start(id,true);
        };
    } else {
        //空だったら差分を消す
        jcanvas("#bgdiff").del();
    }
};


//
//オブジェクト管理メソッド
//
BB.prototype.object = function (objid) {
    return this.member[objid];
};

BB.prototype.nextlevel = function (level) {
    var nextlevel = undefined,
        nextid    = undefined;
    for (var id in this.member) {
        if ((nextlevel === undefined) && (this.jcanvas.layer(id).level()>level)) {
                nextlevel=this.jcanvas.layer(id).level();
                nextid=id;
        } else if((this.jcanvas.layer(id).level()>level) && (this.jcanvas.layer(id).level()<nextlevel)){
                nextlevel=this.jcanvas.layer(id).level();
                nextid=id;
        }
    }
    return {id:nextid, level:nextlevel};
};

BB.prototype.prevlevel = function (level) {
    var prevlevel = undefined,
        previd    = undefined;
    for (var id in this.member) {
        if ((prevlevel === undefined) && (this.jcanvas.layer(id).level()<level)) {
                prevlevel=this.jcanvas.layer(id).level();
                previd=id;
        } else if((this.jcanvas.layer(id).level()<level) && (this.jcanvas.layer(id).level()>prevlevel)){
                prevlevel=this.jcanvas.layer(id).level();
                previd=id;
        }
    }
    return {id:previd, level:prevlevel};
};

//
//画像保管用
//
BB.prototype.save = function() {
    return(jc.canvas(this.id).toDataURL('image/png'));
};

//
//オブジェクト描画
//
BB.prototype.add_circle = function (string, radius, color) {
    return new this.BB_circle(string, radius, color);
};

BB.prototype.add_line = function (string, length, color) {
    return new this.BB_line(string, length, color);
};

BB.prototype.add_scout = function (string, radius, length, duration, color) {
    return new this.BB_scout(string, radius, length, duration, color);
};

BB.prototype.add_sensor = function (string, radius, color) {
    return new this.BB_sensor(string, radius, color);
};

BB.prototype.add_radar = function (string, radius, angle, color) {
    return new this.BB_radar(string, radius, angle, color);
};

BB.prototype.add_howitzer = function (string, radius1, radius2, radius3, color) {
    return new this.BB_howitzer(string, radius1, radius2, radius3, color);
};

BB.prototype.add_freehand = function (color) {
    return new this.BB_freehand(color);
};

//
//zoom
//
BB.prototype.zoom = function (scale, _x, _y) {
    if (scale===undefined) return (this.zoomScale);

    var cnvWidth  = jc.canvas(this.id).width(),
        cnvHeight = jc.canvas(this.id).height(),
        baseLayer = jc.canvas(this.id).layers[0],
        posx      = baseLayer._transformdx,
        posy      = baseLayer._transformdy;

    //初期値と画面端の処理
    if (_x ===undefined) _x=0;
    if (_y ===undefined) _y=0;
    if (_x - posx < 0) { _x=posx; }
    else if(_x - posx + cnvWidth/scale > cnvWidth*this.zoomScale) {
         _x=posx+cnvWidth*this.zoomScale-cnvWidth/scale;
    }
    if (_y - posy < 0) { _y=posy; }
    else if(_y - posy + cnvHeight/scale > cnvHeight*this.zoomScale) {
         _y=posy+cnvHeight*this.zoomScale-cnvHeight/scale;
    }

    //拡大・縮小倍率を書き換え
    this.zoomScale=this.zoomScale * scale;

    //背景(基準レイヤ)の移動
    baseLayer.translate((posx-_x)*scale-posx, (posy-_y)*scale-posy)
             .scale(scale);

    //各画像オブジェクトはオブジェクトごとの拡大動作を実施
    for (var objid in (bbobj.member)) {
        bbobj.object(objid).applyZoom(scale, _x, _y);
    }

    return this;
};

BB.prototype.zoomSelect = function (scale) {
    var obj       = this,
        cnvWidth  = jc.canvas(bbobj.id).width(),
        cnvHeight = jc.canvas(bbobj.id).height(),
        xOffset   = cnvWidth/scale,
        yOffset   = cnvHeight/scale;

    var objs = jc.layer('zoomSelect').objs;
    for (i=0;i<objs.length;i++) {
        jc.layer('zoomSelect').objs[i].del();
    }

    // ガイドとマウスイベントフック用の四角形を最前面に展開
    var rect   = jc.rect(0, 0, xOffset, yOffset, true).color('rgba(255, 255, 0, 0.3)').layer('zoomSelect');
    var hooker = jc.rect(0, 0, cnvWidth, cnvHeight, 'rgba(0, 0, 0, 0)').layer('zoomSelect');
    jc.layer('zoomSelect').level('top');

    hooker.mousemove(function (pt) {
                         var x = pt.x - 10,
                             y = pt.y - 10;
                         if (x < 0) {x=0;}
                         else if(pt.x+xOffset>cnvWidth) {x=(1-1/scale)*cnvWidth;}
                         if (y < 0) {y=0;}
                         else if(pt.y+yOffset>cnvHeight) {y=(1-1/scale)*cnvHeight;}
                         rect.translateTo(x, y);
                     });

    hooker.mousedown(function (pos) {
                         var pt = rect.position();
                         obj.zoom(scale, pt.x, pt.y);

                         rect.del();
                         hooker.del();
                         return false;
                     });

    return this;
};
