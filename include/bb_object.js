(function (global) {
    //
    // 内部変数初期化
    //

    var salt = Math.round((new Date()).getTime() / 1000);

    //
    //jCanvaScriptへの関数、オブジェクト追加
    //

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
        {x:0, y:0, radius:0, length:0, color:'rgb(255, 0, 0)', fill:false},
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

    //CanvaSciprtに扇形オブジェクト追加
    jc.addObject('sector',
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


    //
    // 内部関数定義
    //
    var sanitize_filepath = function (path) {
        var control_codes = /[\u0000-\u001F\u007F-\u009F]/g;
        path.replace(control_codes, "\uFFFD");
        if(path.match(/^([.~]?\/)?([A-Za-z0-9_-][A-Za-z0-9_.-]+\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]+$/)){
            return path;
        } else {
            return null;
        }
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

        var ptsize=5,                            //オブジェクトの操作点を示す白点のサイズ
            ptcolsize=7,                         //操作点を縁取りする色つき円のサイズ
            pttrasize=(window.TouchEvent)?15:7;  //操作点そのもののサイズ

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
            jc.layer(this.id).translate(posx*scale-posx, posy*scale-posy);
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

        this.BB_base.prototype.rotAngle = function () {
            return (jc.layer(this.id).getAngle()*180/Math.PI);
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

        this.BB_base.prototype.rotateTo = function (_angle) {
            jcanvas.layer(this.id).rotateTo(_angle);
            return this;
        };

        this.BB_base.prototype.moveTo = function (_x,_y) {
            //translateToはどこが原点かわからないので、
            //現在までの変位をもとに相対的に移動させる
            var posx = jcanvas.layer(this.id)._transformdx;
            var posy = jcanvas.layer(this.id)._transformdy;
            jcanvas.layer(this.id).translate(_x-posx,_y-posy);
    //        jcanvas.layer(this.id).translateTo(_x,_y);
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
            var objs=jcanvas.layer(this.id).objs;
            jcanvas.layer(this.id).del();
        };

      //
      //BB_circleオブジェクト
      //
        this.BB_circle = function (_text, _radius, _color, _callback) {
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
            if (typeof(_callback) === "function"){_callback.apply(this);};
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


            var ptcol  = jcanvas.circle(ptx, pty, ptcolsize, this._color, true).layer(this.id).opacity(1),
                pt     = jcanvas.circle(ptx, pty, ptsize, "#FFFFFF", true).layer(this.id),
                pttra  = jcanvas.circle(ptx, pty, pttrasize, "rgba(0,0,0,0)", true).layer(this.id),
                radius = jcanvas.text(Math.floor(this._radius)+"m", ptx/2, pty/2).baseline("top")
                                .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id);

            jcanvas.layer(this.id).draggable();

            var txtheight= radius.getRect().height;  //translateTo時に高さがずれるので補正項
            var callback = function () {
                               var pos1=center.position(),pos2=pttra.position(),
                                   dx=pos2.x-pos1.x, dy=pos2.y-pos1.y,
                                   centerx=(pos1.x+pos2.x)/2, centery=(pos1.y+pos2.y)/2,
                                   newrad = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));
                               pt.translateTo(pos2.x, pos2.y);
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

            pttra.draggable(callback);
            pttra.optns.drag.val=false;
            pttra.mouseover(function () {
                            jcanvas.layer(obj.id).optns.drag.val=false;
                            pttra.optns.drag.val=true;
                         });
            pttra.mouseout(function () {
                            jcanvas.layer(obj.id).optns.drag.val=true;
                            pttra.optns.drag.val=false;
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
        this.BB_line = function (_text, _length, _color, _callback) {
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
            if (typeof(_callback) === "function"){_callback.apply(this);};
        };
        this.BB_line.prototype=new this.BB_base();

        //座標の扱いが特殊なので座標関連の関数を一部オーバーライド
        this.BB_line.prototype.position = function () {
            var _x = jcanvas.layer(this.id)._transformdx + (this._pt1pos.x + this._pt2pos.x)/2,
                _y = jcanvas.layer(this.id)._transformdy + (this._pt1pos.y + this._pt2pos.y)/2;
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
                x1=this._pt1pos.x, y1=this._pt1pos.y,
                x2=this._pt2pos.x, y2=this._pt2pos.y,
                obj    = this;
            var centerx=(x1+x2)/2, centery=(y1+y2)/2;

            var line     = jcanvas.line({points:[[x1, y1], [x2, y2]], color:this._color})
                                  .opacity(1).lineStyle({lineWidth:3}).layer(this.id),
                pt1col   = jcanvas.circle(x1, y1, ptcolsize, this._color, true).layer(this.id),
                pt1      = jcanvas.circle(x1, y1, ptsize, "#FFFFFF", true).layer(this.id),
                pt1tra   = jcanvas.circle(x1, y1, pttrasize, "rgba(0,0,0,0)", true).layer(this.id),
                pt2col   = jcanvas.circle(x2, y2, ptcolsize, this._color, true).layer(this.id),
                pt2      = jcanvas.circle(x2, y2, ptsize, "#FFFFFF", true).layer(this.id),
                pt2tra   = jcanvas.circle(x2, y2, pttrasize, "rgba(0,0,0,0)", true).layer(this.id),
                linename = jcanvas.text(this._text, centerx, centery+above)
                                  .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id),
                linelen  = jcanvas.text(Math.floor(this._length)+"m", centerx, centery-below)
                                  .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id);
            jcanvas.layer(this.id).draggable();
            
            var txtheight= linelen.getRect().height;  //translateTo時に高さがずれるので補正項
            var callback = function () {
                               var pos1=pt1tra.position(), pos2=pt2tra.position(),
                                   dx=pos2.x-pos1.x, dy=pos2.y-pos1.y,
                                   centerx=(pos1.x+pos2.x)/2, centery=(pos1.y+pos2.y)/2,
                                   newlen = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));
                               pt1col.translateTo(pos1.x, pos1.y);
                               pt2col.translateTo(pos2.x, pos2.y);
                               pt1.translateTo(pos1.x, pos1.y);
                               pt2.translateTo(pos2.x, pos2.y);
                               line.points([[pt1._x+pt1._transformdx, pt1._y+pt1._transformdy],
                                            [pt2._x+pt2._transformdx, pt2._y+pt2._transformdy]]);
                               linename.translateTo(centerx, centery+above-txtheight);
                               linelen.translateTo(centerx, centery-below-txtheight)
                                      .string(Math.floor(bbobj.pixel_to_meter(newlen))+"m");
                               obj._length = bbobj.pixel_to_meter(newlen);
                               obj._pt1pos={x:pt1._x+pt1._transformdx ,y:pt1._y+pt1._transformdy};
                               obj._pt2pos={x:pt2._x+pt2._transformdx ,y:pt2._y+pt2._transformdy};
                           };
            pt1tra.draggable(callback);
            pt1tra.optns.drag.val=false;
            pt2tra.draggable(callback);
            pt2tra.optns.drag.val=false;
            pt1tra.mouseover(function () {
                              jcanvas.layer(obj.id).optns.drag.val=false;
                              pt1tra.optns.drag.val=true;
                          });
            pt1tra.mouseout(function () {
                            jcanvas.layer(obj.id).optns.drag.val=true;
                            pt1tra.optns.drag.val=false;
                         });
            pt2tra.mouseover(function () {
                              jcanvas.layer(obj.id).optns.drag.val=false;
                              pt2tra.optns.drag.val=true;
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
      //BB_pointオブジェクト
      //
        this.BB_point = function (_text, _size, _color, _align, _callback) {
            if (_color===undefined) {_color='rgb(0, 0, 0)';}
            if (_align===undefined) {_align=0;}
            this.id=UUID.genV1().toString();

            this.type="point";
            this._text=_text;
            this._size=parseInt(_size);
            this._align=_align;
            this._color=_color;
            this.draw();
            this.move(100, 100);
            this.regist();
            if (typeof(_callback) === "function"){_callback.apply(this);};
        };
        this.BB_point.prototype=new this.BB_base();

        this.BB_point.prototype.draw = function () {
            jcanvas.circle(0, 0, this._size, this._color, true).opacity(1).layer(this.id);
            jcanvas.circle(0, 0, pttrasize, "rgba(0,0,0,0)", true).layer(this.id);
            if (this._align == 1) {
                // 左側
                var text = jcanvas.text(this._text, (-1) * (this._size + 5) , 0)
                                  .layer(this.id).color('#FFFFFF').font('15px sans-serif')
                                  .align('right').baseline('middle');
            } else {
                // 右側
                var text = jcanvas.text(this._text, this._size + 5 , 0)
                                  .layer(this.id).color('#FFFFFF').font('15px sans-serif')
                                  .align('left').baseline('middle');
            }
            jcanvas.layer(this.id).draggable();
            return this;
        };

      //
      //BB_scoutオブジェクト
      //
        this.BB_scout = function (_text, _radius, _length, _duration, _color, _callback) {
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
            if (typeof(_callback) === "function"){_callback.apply(this);};
        };
        this.BB_scout.prototype=new this.BB_base();

        this.BB_scout.prototype.draw = function () {
            var px_rad  = bbobj.meter_to_pixel(this._radius),
                px_len  = bbobj.meter_to_pixel(this._length),
                obj     = this;

            var frame = jcanvas.circle(0, 0, px_rad, this._color, false).layer(this.id).opacity(1),
                scout = jcanvas.circle(0, 0, px_rad, this._color, true).opacity(0.3).layer(this.id),
                area  = jcanvas.scout(0, 0, px_rad, px_len, this._color, true).opacity(0.2).layer(this.id),
                areaf = jcanvas.scout(0, 0, px_rad, px_len, this._color, false).opacity(1).layer(this.id),
                mask  = jcanvas.scout_mask(0, 0, px_rad, px_len).layer(this.id);
            jcanvas.circle(0, 0, ptsize, '#FFFFFF', true).layer(this.id);
            jcanvas.text(this._text, 0, -10)
                   .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id);
            jcanvas.layer(this.id).draggable();
            

            //角度変更処理
            mask.mousedown(function(point){
                               var canvas = jc.canvas(bbobj.id),
                                   tmpmask = jcanvas.rect(0, 0, canvas.width(), canvas.height(), 'rgba(0, 0, 0, 0)')
                                                    .layer("tmp_" + obj.id),
                                   layer    = jcanvas.layer(obj.id),
                                   tmpLayer = jcanvas.layer("tmp_" + obj.id);
                               tmpLayer.level('top');
                               var pos_sct  = scout.position();
                               var startrad = Math.atan2((point.y-pos_sct.y), (point.x-pos_sct.x)),
                                   baserad  = layer.getAngle();
                               tmpmask.mousemove(function (pos) {
                                                     var nowrad = Math.atan2((pos.y-pos_sct.y), (pos.x-pos_sct.x));
                                                     var rad    = baserad + (nowrad - startrad);
                                                     layer.rotateTo((rad*180/Math.PI), 0, 0);
                                                 });
                               tmpmask.mouseup(function (point) {
                                                   jcanvas.layer("tmp_" + obj.id).del();
                                               });
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
        this.BB_sensor = function (_text, _radius, _color, _callback) {
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
            if (typeof(_callback) === "function"){_callback.apply(this);};
        };
        this.BB_sensor.prototype=new this.BB_base();

        this.BB_sensor.prototype.draw = function () {
            var px_rad = bbobj.meter_to_pixel(this._radius);
            jcanvas.circle(0, 0, px_rad, this._color, false).opacity(1).layer(this.id);
            jcanvas.circle(0, 0, px_rad, this._color, true).opacity(0.5).layer(this.id);
            jcanvas.circle(0, 0, ptsize, this._color, true).layer(this.id).color('#FFFFFF');
            jcanvas.text(this._text, 0, -10)
                   .align('center').layer(this.id).color('#FFFFFF').font('15px sans-serif');
            jcanvas.layer(this.id).draggable();
            return this;
        };

      //
      //BB_radarオブジェクト
      //
        this.BB_radar = function (_text, _radius, _angle, _color, _callback) {
            if (_color===undefined) {_color='rgb(255, 0, 0)';}
            this.id=UUID.genV1().toString();

            this.type="radar";
            this._text=_text;
            this._radius=_radius;
            this._angle=_angle;
            this._color=_color;
            //描画して登録。初期座標は偵察半径分ずらす
            //支援マークはファイル依存させないため手打ち。
            this._image    = new Image;
            this._image.src= 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAIAAAC0tAIdAAAABnRS'
                           + 'TlMA/wD/AP83WBt9AAAAZUlEQVR42qWRSwrAMAhEK4j3v64LMZQGk5hJsdRVxjw/g+TuVzlopo'
                           + 'loJxYgBERTQabTYinZ6WgM6cgvNHQ8f930o1VVROCcKBj0bveNHuPOEuwNaeCyNzi8f1zHzJi5'
                           + 'evlKfKMbjWF644wwKScAAAAASUVORK5CYII=';
            var obj        = this;
            this._image.onload= function () {
                obj.draw();
                var px_rad = bbobj.meter_to_pixel(obj._radius);
                obj.move(px_rad, px_rad);
                obj.regist();
                if (typeof(_callback) === "function"){_callback.apply(obj);};
                delete this._image;
            };
        };
        this.BB_radar.prototype=new this.BB_base();

        this.BB_radar.prototype.draw = function () {
            var px_rad = bbobj.meter_to_pixel(this._radius),
                obj    = this,
                img_width  = this._image.width,
                img_height = this._image.height,
                img_rad     = Math.sqrt(Math.pow(this._image.width,2) + Math.pow(this._image.height,2))*0.5;

            jcanvas.sector(0, 0, px_rad, this._angle, this._color, false).opacity(1).layer(this.id);
            var area = jcanvas.sector(0, 0, px_rad, this._angle, this._color, true).opacity(0.5).layer(this.id);
            jcanvas.circle(0, 0, img_rad, this._color, true).opacity(0.9).layer(this.id);
            jcanvas.circle(0, 0, img_rad-2, '#ffffff', true).layer(this.id);
            jcanvas.circle(0, 0, pttrasize, 'rgba(0,0,0,0)', true).layer(this.id);
            jcanvas.image(this._image, img_width * (-0.5), img_height * (-0.5), img_width , img_height).layer(this.id)
                   .rotate(90);
            var text = jcanvas.text(this._text, 60, 0)
                       .align('center').layer(this.id).color('#FFFFFF').font('15px sans-serif');
            jcanvas.layer(this.id).draggable();

            //移動処理(draggableでは回転できないため、独自定義)
            var mdEvent = function(point){
                              var pos_base = area.position(),
                                  canvas   = jc.canvas(bbobj.id),
                                  radius   = Math.sqrt(Math.pow((point.x-pos_base.x),2) + Math.pow((point.y-pos_base.y),2)),
                                  startrad = Math.atan2((point.y-pos_base.y), (point.x-pos_base.x)),
                                  baserad  = jcanvas.layer(obj.id).getAngle(),
                                  tmpmask  = jcanvas.rect(0, 0, canvas.width(), canvas.height(), 'rgba(0, 0, 0, 0)')
                                                    .layer("tmp_" + obj.id),
                                  layer    = jcanvas.layer(obj.id),
                                  tmpLayer = jcanvas.layer("tmp_" + obj.id);
                              tmpLayer.level('top');
                              tmpmask.mousemove(function (pos) {
                                                    var nowrad   = Math.atan2((pos.y-pos_base.y), (pos.x-pos_base.x)),
                                                        rad      = baserad+(nowrad - startrad);
                                                     layer.rotateTo((rad*180/Math.PI), 0, 0);
                                                });
                              tmpmask.mouseup(function() {
                                                  tmpLayer.del();
                                              });
                          };

            //扇形部分は角度変更
            area.mousedown(mdEvent);
            area.mouseover(function () {
                               jcanvas.layer(obj.id).optns.drag.val=false;  // ドラッグ無効
                           });
            area.mouseout(function () {
                              jcanvas.layer(obj.id).optns.drag.val=true;    // ドラッグ有効
                          });
            //文字列部分も角度変更
            text.mousedown(mdEvent);
            text.mouseover(function () {
                               jcanvas.layer(obj.id).optns.drag.val=false;  // ドラッグ無効
                           });
            text.mouseout(function () {
                              jcanvas.layer(obj.id).optns.drag.val=true;    // ドラッグ有効
                          });

            return this;
        };

      //
      //BB_sondeオブジェクト
      //
        this.BB_sonde = function (_text, _radius1, _radius2, _color, _callback) {
            if (_color===undefined) {_color='#00FF00';}
            this.id=UUID.genV1().toString();

            this.type="sonde";
            this._text=_text;
            this._radius1=_radius1;  //射程範囲
            this._radius2=_radius2;  //偵察範囲
            this._color=_color;
            this._markerx=0;
            this._markery=0;
            //描画して登録。初期座標は有効射程分ずらす
            this.draw();
            var px_rad1 = bbobj.meter_to_pixel(this._radius1);
            this.move(px_rad1, px_rad1);
            this.regist();
            if (typeof(_callback) === "function"){_callback.apply(this);};
        };
        this.BB_sonde.prototype=new this.BB_base();

        this.BB_sonde.prototype.draw = function () {
            var px_rad1 = bbobj.meter_to_pixel(this._radius1),
                px_rad2 = bbobj.meter_to_pixel(this._radius2),
                obj     = this;

            //射程範囲の表示
            jcanvas.circle(0, 0, px_rad1, this._color, false).opacity(1).layer(this.id);
            var range   = jcanvas.circle(0, 0, px_rad1, this._color, true).opacity(0.2).layer(this.id);
            jcanvas.circle(0, 0, ptsize, '#FFFFFF', true).layer(this.id);
            jcanvas.text(this._text, 0, -40)
                   .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id);

            //照準円の表示
            var tgtline = jcanvas.circle(this._markerx, this._markery, px_rad2, this._color, false).opacity(1).layer(this.id),
                tgt     = jcanvas.circle(this._markerx, this._markery, px_rad2, this._color, true).opacity(0.5).layer(this.id),
                cross   = jcanvas.crosshair(this._markerx, this._markery).layer(this.id);
            jcanvas.layer(this.id).draggable();

            var dragfunc = function (cursor) {
                                    var followflag = true,
                                        pos   = this.position(),
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
                                        tgt.translateTo(pos.x,pos.y);
                                        tgtline.translateTo(pos.x,pos.y);
                                        cross.translateTo(pos.x,pos.y);
                                    } else {
                                        var rad = Math.atan2((cursor.y-base.y),(cursor.x-base.x));
                                        var x = base.x+px_rad1*Math.cos(rad);
                                        var y = base.y+px_rad1*Math.sin(rad);
                                        tgt.translateTo(x,y);
                                        tgtline.translateTo(x,y);
                                        cross.translateTo(x,y);
                                    }
                                    obj._markerx=point._x+point._transformdx;
                                    obj._markery=point._y+point._transformdy;
                           };

            var tgtdrag = function () {
                             jcanvas.layer(obj.id).optns.drag.val=false;
                             this.optns.drag.val=true;
                          };

            var tgtundrag = function () {
                                jcanvas.layer(obj.id).optns.drag.val=true;
                                this.optns.drag.val=false;
                            };

            var resetfunc = function () {
                                // 最初の位置に戻す
                                var base  = range.position();
                                tgt.translateTo(base.x,base.y);
                                tgtline.translateTo(base.x,base.y);
                                cross.translateTo(base.x,base.y);
                                obj._markerx=point._x+point._transformdx;
                                obj._markery=point._y+point._transformdy;
                                return false;
                            };


            //索敵地点の処理
            tgt.draggable(dragfunc);
            cross.draggable(dragfunc);

            //初期状態ではレイヤを優先するため、個別ドラッグを抑止。
            //ターゲット部分でボタンが押下された場合のみターゲットの個別ドラッグを有効化。
            tgt.optns.drag.val=false;
            tgt.mouseover(tgtdrag);
            tgt.mouseout(tgtundrag);
            tgt.dblclick(resetfunc);

            //中心点も同様に処理させる
            //ただし、dblclickはpropagationするのでtgtに任せる
            cross.optns.drag.val=false;
            cross.mouseover(tgtdrag);
            cross.mouseout(tgtundrag);

            return this;
        };

        this.BB_sonde.prototype.applyZoom = function (scale, _x, _y) {
            this._markerx = this._markerx * scale;
            this._markery = this._markery * scale;
            bbobj.BB_base.prototype.applyZoom.apply(this, arguments);
            return this;
        };

      //
      //BB_ndsensor オブジェクト
      //
        this.BB_ndsensor = function (_text, _radius, _color, _callback) {
            if (_color===undefined) {_color='rgb(255, 0, 0)';}
            this.id=UUID.genV1().toString();

            this.type="ndsensor";
            this._text=_text;
            this._radius=_radius;
            this._color=_color;

            //中央アイコンはファイル依存させないため手打ち。
            this._image    = new Image;
            this._image.src= 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAIAAAC0tAIdAAAABnRS'
                           + 'TlMA/wAAAP+JwC+QAAAAeElEQVR42q2QbQrAIAiG9WBBO1l0sgUdzFWSE1urwfoh6fvw+oEEBN'
                           + 'sPRxpbER8lKRV5Znkz1YYOwBRCEDnGaFIgT3gqP/K9X5pVvk8ybmmgxU126YLmnJ1zHK2qc3bV'
                           + 'tOlg6XK4eq/2+L+mdfyJltFlnrctlxe8AGPpa/QtEubEAAAAAElFTkSuQmCC';

            //描画して登録。初期座標はx方向に偵察半径+100、y方向に100ずらす
            var obj        = this;
            this._image.onload= function () {
                obj.draw();
                var px_rad  = bbobj.meter_to_pixel(obj._radius);
                obj.move(100+px_rad, 100);
                obj.regist();
                if (typeof(_callback) === "function"){_callback.apply(obj);};
                delete this._image;
            };
        };
        this.BB_ndsensor.prototype=new this.BB_base();

        this.BB_ndsensor.prototype.draw = function () {
            var px_rad  = bbobj.meter_to_pixel(this._radius),
                obj     = this,
                above  = 10,
                below  = 5,
                img_width  = this._image.width,
                img_height = this._image.height,
                img_rad     = Math.sqrt(Math.pow(this._image.width,2) + Math.pow(this._image.height,2))*0.5;

            var line     = jcanvas.line({points:[[px_rad, 0], [(-1) * px_rad, 0]], color:this._color})
                                  .opacity(1).lineStyle({lineWidth:3}).layer(this.id),
                pt1col   = jcanvas.circle(px_rad, 0, ptcolsize, this._color, true).layer(this.id),
                pt1      = jcanvas.circle(px_rad, 0, ptsize, "#FFFFFF", true).layer(this.id),
                pt1tra   = jcanvas.circle(px_rad, 0, pttrasize, "rgba(0,0,0,0)", true).layer(this.id),
                pt2col   = jcanvas.circle((-1) * px_rad, 0, ptcolsize, this._color, true).layer(this.id),
                pt2      = jcanvas.circle((-1) * px_rad, 0, ptsize, "#FFFFFF", true).layer(this.id),
                pt2tra   = jcanvas.circle((-1) * px_rad, 0, pttrasize, "rgba(0,0,0,0)", true).layer(this.id),
                center   = jcanvas.circle(0, 0, img_rad, this._color, true).layer(this.id),
                centertra= jcanvas.circle(0, 0, pttrasize, "rgba(0,0,0,0)",true).layer(this.id);

            jcanvas.circle(0, 0, img_rad-2, '#FFFFFF', true).layer(this.id);
            jcanvas.image(this._image, img_width * (-0.5), img_height * (-0.5), img_width , img_height).layer(this.id);
            jcanvas.text(this._text, 0, 0+above+img_height)
                   .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id);
            jcanvas.layer(this.id).draggable();
            
            //移動処理(draggableでは回転できないため、独自定義)
            var mdEvent = function(point){
                              var pos_base = center.position(),
                                  canvas   = jc.canvas(bbobj.id),
                                  radius   = Math.sqrt(Math.pow((point.x),2) + Math.pow((point.y),2)),
                                  startrad = Math.atan2((point.y-pos_base.y), (point.x-pos_base.x)),
                                  baserad  = jcanvas.layer(obj.id).getAngle(),
                                  tmpmask  = jcanvas.rect(0, 0, canvas.width(), canvas.height(), 'rgba(0, 0, 0, 0)')
                                                    .layer("tmp_" + obj.id),
                                  layer    = jcanvas.layer(obj.id),
                                  tmpLayer = jcanvas.layer("tmp_" + obj.id);
                              tmpLayer.level('top');
                              tmpmask.mousemove(function (pos) {
                                                    var nowrad   = Math.atan2((pos.y-pos_base.y), (pos.x-pos_base.x)),
                                                        rad      = baserad+(nowrad - startrad);
                                                     layer.rotateTo((rad*180/Math.PI), 0, 0);
                                                });
                              tmpmask.mouseup(function() {
                                                  tmpLayer.del();
                                              });
                          };

            //端点は角度変更
            pt1tra.mousedown(mdEvent);
            pt1tra.mouseover(function () {
                               jcanvas.layer(obj.id).optns.drag.val=false;  // ドラッグ無効
                           });
            pt1tra.mouseout(function () {
                              jcanvas.layer(obj.id).optns.drag.val=true;    // ドラッグ有効
                          });
            pt2tra.mousedown(mdEvent);
            pt2tra.mouseover(function () {
                               jcanvas.layer(obj.id).optns.drag.val=false;  // ドラッグ無効
                           });
            pt2tra.mouseout(function () {
                              jcanvas.layer(obj.id).optns.drag.val=true;    // ドラッグ有効
                          });
            return this;

        };

      //
      //BB_howitzerオブジェクト
      //
        this.BB_howitzer = function (_text, _radius1, _radius2, _radius3, _color, _callback) {
            if (_color===undefined) {_color='#FFA500';}
            this.id=UUID.genV1().toString();

            this.type="howitzer";
            this._text=_text;
            this._radius1=_radius1;  //射程範囲
            this._radius2=_radius2;  //爆風範囲
            this._radius3=_radius3;  //誤差範囲
            this._color=_color;
            this._markerx=0;
            this._markery=0;
            //描画して登録。初期座標は有効射程分ずらす
            this.draw();
            var px_rad1 = bbobj.meter_to_pixel(this._radius1);
            this.move(px_rad1, px_rad1);
            this.regist();
            if (typeof(_callback) === "function"){_callback.apply(this);};
        };
        this.BB_howitzer.prototype=new this.BB_base();

        this.BB_howitzer.prototype.draw = function () {
            var px_rad1 = bbobj.meter_to_pixel(this._radius1),
                px_rad2 = bbobj.meter_to_pixel(this._radius2),
                px_rad3 = bbobj.meter_to_pixel(this._radius3)+px_rad2,
                obj     = this;

            //射程範囲の表示
            jcanvas.circle(0, 0, px_rad1, this._color, false).opacity(1).layer(this.id);
            var range   = jcanvas.circle(0, 0, px_rad1, this._color, true).opacity(0.2).layer(this.id);
            jcanvas.circle(0, 0, ptsize, '#FFFFFF', true).layer(this.id);
            jcanvas.text(this._text, 0, -40)
                   .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id);

            //照準円の表示
            var area    = jcanvas.circle(this._markerx, this._markery, px_rad3, this._color, false).opacity(1).layer(this.id),
                tgtline = jcanvas.circle(this._markerx, this._markery, px_rad2, this._color, false).opacity(1).layer(this.id),
                tgt     = jcanvas.circle(this._markerx, this._markery, px_rad2, this._color, true).opacity(0.3).layer(this.id),
                cross   = jcanvas.crosshair(this._markerx, this._markery).layer(this.id);
            jcanvas.layer(this.id).draggable();

            var dragfunc = function (cursor) {
                                    var followflag = true,
                                   pos   = this.position(),
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
                                   tgt.translateTo(pos.x,pos.y);
                                        tgtline.translateTo(pos.x,pos.y);
                                        cross.translateTo(pos.x,pos.y);
                                        area.translateTo(pos.x,pos.y);
                                    } else {
                                        var rad = Math.atan2((cursor.y-base.y),(cursor.x-base.x));
                                        var x = base.x+px_rad1*Math.cos(rad);
                                        var y = base.y+px_rad1*Math.sin(rad);
                                        tgt.translateTo(x,y);
                                        tgtline.translateTo(x,y);
                                        cross.translateTo(x,y);
                                        area.translateTo(x,y);
                                    }
                                    obj._markerx=area._x+area._transformdx;
                                    obj._markery=area._y+area._transformdy;
                           };

            var tgtdrag = function () {
                            jcanvas.layer(obj.id).optns.drag.val=false;
                              this.optns.drag.val=true;
                          };

            var tgtundrag = function () {
                           jcanvas.layer(obj.id).optns.drag.val=true;
                                this.optns.drag.val=false;
                            };

            var resetfunc = function () {
                            // 最初の位置に戻す
                            var base  = range.position();
                            tgt.translateTo(base.x,base.y);
                            tgtline.translateTo(base.x,base.y);
                            cross.translateTo(base.x,base.y);
                            area.translateTo(base.x,base.y);
                            obj._markerx=area._x+area._transformdx;
                            obj._markery=area._y+area._transformdy;
                            return false;
                            };

            //砲撃地点の処理
            tgt.draggable(dragfunc);
            cross.draggable(dragfunc);

            //初期状態ではレイヤを優先するため、個別ドラッグを抑止。
            //ターゲット部分でボタンが押下された場合のみターゲットの個別ドラッグを有効化。
            tgt.optns.drag.val=false;
            tgt.mouseover(tgtdrag);
            tgt.mouseout(tgtundrag);
            tgt.dblclick(resetfunc);

            //マーカーも同様に処理させる
            //ただし、dblclickはpropagationするのでtgtに任せる
            cross.optns.drag.val=false;
            cross.mouseover(tgtdrag);
            cross.mouseout(tgtundrag);

            return this;
        };

        this.BB_howitzer.prototype.applyZoom = function (scale, _x, _y) {
            this._markerx = this._markerx * scale;
            this._markery = this._markery * scale;
            bbobj.BB_base.prototype.applyZoom.apply(this, arguments);
            return this;
        };

      //
      //BB_bunkerオブジェクト
      //
        this.BB_bunker = function (_text, _color, _callback) {
            if (_color===undefined) {_color='rgb(255, 0, 165)';}
            this.id=UUID.genV1().toString();

            this.type="bunker";
            this._text=_text;
            this._rad1=28;  //攻撃範囲28m
            this._rad2=40;  //爆風範囲40m
            this._color=_color;
            //描画して登録。初期座標は半径分ずらす
            this.draw();
            var px_rad = bbobj.meter_to_pixel(this._rad2);
            this.move(px_rad, px_rad);
            this.regist();
            if (typeof(_callback) === "function"){_callback.apply(this);};
        };
        this.BB_bunker.prototype=new this.BB_base();

        this.BB_bunker.prototype.draw = function () {
            var px_rad1 = bbobj.meter_to_pixel(this._rad1);
            var px_rad2 = bbobj.meter_to_pixel(this._rad2);
            jcanvas.circle(0, 0, px_rad1, this._color, true).opacity(0.3).layer(this.id);
            jcanvas.circle(0, 0, px_rad1, this._color, false).opacity(1).layer(this.id);
            jcanvas.circle(0, 0, px_rad2, this._color, true).opacity(0.2).layer(this.id);
            jcanvas.circle(0, 0, px_rad2, this._color, false).opacity(1).layer(this.id);
            jcanvas.circle(0, 0, ptsize, this._color, true).layer(this.id).color('#FFFFFF');
            jcanvas.text(this._text, 0, -10)
                   .align('center').layer(this.id).color('#FFFFFF').font('15px sans-serif');
            jcanvas.layer(this.id).draggable();
            return this;
        };


      //
      //BB_sentryオブジェクト
      //
        this.BB_sentry = function (_text, _color, _callback) {
            if (_color===undefined) {_color='rgb(255, 0, 0)';}
            this.id=UUID.genV1().toString();

            this.type="sentry";
            this._text=_text;
            this._radius=80; //固定値
            this._angle=120; //固定値
            this._color=_color;
            //描画して登録。初期座標は偵察半径分ずらす
            //マークはファイル依存させないため手打ち。
            this._image    = new Image;
            this._image.src= 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAIAAAC0tAIdAAAABnR'
                           + 'STlMA/wD/AP83WBt9AAAAYUlEQVR42pWRUQ7AIAhD13txN7gbB2PLWMxUROSrJq8NVJjZVR4M'
                           + 'NAAXYUpHP2h7/nVHt7xk3PkFrAyq6oKIgk1cMLOIZHtv0biTM7ra4NaAOOM1ZPRc4ln2bFv+T'
                           + 'vXKZG6yP1bjQ2hwBAAAAABJRU5ErkJggg==';
            var obj        = this;
            this._image.onload= function () {
                obj.draw();
                var px_rad = bbobj.meter_to_pixel(obj._radius);
                obj.move(px_rad, px_rad);
                obj.regist();
                if (typeof(_callback) === "function"){_callback.apply(obj);};
                delete this._image;
            };
        };
        this.BB_sentry.prototype=new this.BB_base();

        this.BB_sentry.prototype.draw = function () {
            var px_rad = bbobj.meter_to_pixel(this._radius),
                obj    = this,
                img_width  = this._image.width,
                img_height = this._image.height,
                img_rad     = Math.sqrt(Math.pow(this._image.width,2) + Math.pow(this._image.height,2))*0.5;

            jcanvas.sector(0, 0, px_rad, this._angle, this._color, false).opacity(1).layer(this.id);
            var area = jcanvas.sector(0, 0, px_rad, this._angle, this._color, true).opacity(0.5).layer(this.id);
            jcanvas.circle(0, 0, img_rad, this._color, true).opacity(0.9).layer(this.id);
            jcanvas.circle(0, 0, img_rad-2, '#ffffff', true).layer(this.id);
            jcanvas.circle(0, 0, pttrasize, 'rgba(0,0,0,0)', true).layer(this.id);
            jcanvas.image(this._image, img_width * (-0.5), img_height * (-0.5), img_width , img_height).layer(this.id);
            var text = jcanvas.text(this._text, 50, 0)
                       .align('center').layer(this.id).color('#FFFFFF').font('15px sans-serif');
            jcanvas.layer(this.id).draggable();

            //移動処理(draggableでは回転できないため、独自定義)
            var mdEvent = function(point){
                              var pos_base = area.position(),
                                  canvas   = jc.canvas(bbobj.id),
                                  radius   = Math.sqrt(Math.pow((point.x-pos_base.x),2) + Math.pow((point.y-pos_base.y),2)),
                                  startrad = Math.atan2((point.y-pos_base.y), (point.x-pos_base.x)),
                                  baserad  = jcanvas.layer(obj.id).getAngle(),
                                  tmpmask  = jcanvas.rect(0, 0, canvas.width(), canvas.height(), 'rgba(0, 0, 0, 0)')
                                                    .layer("tmp_" + obj.id),
                                  layer    = jcanvas.layer(obj.id),
                                  tmpLayer = jcanvas.layer("tmp_" + obj.id);
                              tmpLayer.level('top');
                              tmpmask.mousemove(function (pos) {
                                                    var nowrad   = Math.atan2((pos.y-pos_base.y), (pos.x-pos_base.x)),
                                                        rad      = baserad+(nowrad - startrad);
                                                     layer.rotateTo((rad*180/Math.PI), 0, 0);
                                                });
                              tmpmask.mouseup(function() {
                                                  tmpLayer.del();
                                              });
                          };

            //扇形部分は角度変更
            area.mousedown(mdEvent);
            area.mouseover(function () {
                               jcanvas.layer(obj.id).optns.drag.val=false;  // ドラッグ無効
                           });
            area.mouseout(function () {
                              jcanvas.layer(obj.id).optns.drag.val=true;    // ドラッグ有効
                          });
            //文字列部分も角度変更
            text.mousedown(mdEvent);
            text.mouseover(function () {
                               jcanvas.layer(obj.id).optns.drag.val=false;  // ドラッグ無効
                           });
            text.mouseout(function () {
                              jcanvas.layer(obj.id).optns.drag.val=true;    // ドラッグ有効
                          });

            return this;
        };

      //
      //BB_aerosentryオブジェクト
      //
        this.BB_aerosentry = function (_text, _color, _callback) {
            if (_color===undefined) {_color='rgb(255, 0, 0)';}
            this.id=UUID.genV1().toString();

            this.type="aerosentry";
            this._text=_text;
            this._radius=40; //固定値
            this._color=_color;
            //描画して登録。初期座標は偵察半径分ずらす
            //マークはファイル依存させないため手打ち。
            this._image    = new Image;
            this._image.src= 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAIAAAC0tAIdAAAAAXN'
                           + 'SR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABsSURBVChT'
                           + 'nYxBEoAwDAL7/09HWkgkNid3xnED6IqIdYAU98mEIjtVRnZ62FIKqbOkf9fPocJD3ijxkHzXI'
                           + '1r4GqjsqDu0A2iSKE3+/lvlhBb3ugR4SFoN/JwrvGgUMPqeEk/B7XvkdqoZDSIeqpRXt5iMa4'
                           + 'kAAAAASUVORK5CYII=';
            var obj        = this;
            this._image.onload= function () {
                obj.draw();
                var px_rad = bbobj.meter_to_pixel(obj._radius);
                obj.move(px_rad, px_rad);
                obj.regist();
                if (typeof(_callback) === "function"){_callback.apply(obj);};
                delete this._image;
            };
        };
        this.BB_aerosentry.prototype=new this.BB_base();

        this.BB_aerosentry.prototype.draw = function () {
            var px_rad = bbobj.meter_to_pixel(this._radius),
                obj    = this,
                img_width  = this._image.width,
                img_height = this._image.height,
                img_rad     = Math.sqrt(Math.pow(this._image.width,2) + Math.pow(this._image.height,2))*0.5;

            jcanvas.circle(0, 0, px_rad, this._color, false).opacity(1).layer(this.id);
            var area = jcanvas.circle(0, 0, px_rad, this._color, true).opacity(0.3).layer(this.id);
            jcanvas.circle(0, 0, img_rad, this._color, true).opacity(0.9).layer(this.id);
            jcanvas.circle(0, 0, img_rad-2, '#ffffff', true).layer(this.id);
            jcanvas.image(this._image, img_width * (-0.5), img_height * (-0.5), img_width , img_height).layer(this.id);

            jcanvas.text(this._text, 0, -10)
                   .align('center').layer(this.id).color('#FFFFFF').font('15px sans-serif');
            jcanvas.layer(this.id).draggable();

            return this;
        };


      //
      //BB_bomberオブジェクト
      //
        this.BB_bomber = function (_text, _color, _callback) {
            if (_color===undefined) {_color='rgb(255, 0, 165)';}
            this.id=UUID.genV1().toString();

            this.type="bomber";
            this._text=_text;
            this._rad1= 25;  //爆風範囲
            this._rad2=  0;  //着弾誤差範囲
            this._center=[50,65,80,95,110,125,140,155,170,185,200,215];  //爆心
            this._color=_color;
            //描画して登録。初期座標は半径分ずらす
            this.draw();
            var px_rad = bbobj.meter_to_pixel(this._rad1);
            this.move(px_rad, px_rad);
            this.regist();
            if (typeof(_callback) === "function"){_callback.apply(this);};
        };
        this.BB_bomber.prototype=new this.BB_base();

        this.BB_bomber.prototype.draw = function () {
            var px_rad1   = bbobj.meter_to_pixel(this._rad1),
                px_rad2   = px_rad1 + bbobj.meter_to_pixel(this._rad2),
                px_len    = bbobj.meter_to_pixel(this._center[this._center.length-1]),
                crosshair = [],
                point_ch  = [];

            //攻撃位置を変換しておく
            for ( var i = 0; i < this._center.length; ++i ) {
                point_ch[i] = bbobj.meter_to_pixel(this._center[i]);
            }

            jcanvas.scout(0, 0, px_rad1, px_len, this._color, true).opacity(0.2).layer(this.id);
            jcanvas.scout(0, 0, px_rad1, px_len, this._color, false).opacity(1).layer(this.id);
            var self =jcanvas.circle(0, 0, ptsize, '#FFFFFF', true).layer(this.id);

            //攻撃範囲表示
            for ( var i = 0; i < this._center.length; ++i ) {
                jcanvas.circle(point_ch[i] , 0, px_rad1, this._color, false).opacity(1).layer(this.id),
                jcanvas.circle(point_ch[i] , 0, px_rad2, this._color, true).opacity(0.3).layer(this.id);
            }

            //クロスヘア表示
            var angle = (jcanvas.layer(this.id).getAngle())*(-180)/Math.PI;
            for ( var i = 0; i < this._center.length; ++i ) {
                crosshair.push(jcanvas.crosshair(point_ch[i] , 0).layer(this.id)
                                                                 .rotateTo(angle, point_ch[i] , 0));
            }

            jcanvas.text(this._text, 0, -10)
                   .align('center').layer(this.id).color('#FFFFFF').font('15px sans-serif');
            jcanvas.layer(this.id).draggable();

            //角度変更処理
            var mask = jcanvas.scout_mask(0, 0, px_rad1, px_len).layer(this.id),
                 obj = this;
            mask.mousedown(function(point){
                               var canvas = jc.canvas(bbobj.id),
                                   tmpmask = jcanvas.rect(0, 0, canvas.width(), canvas.height(), 'rgba(0, 0, 0, 0)')
                                                    .layer("tmp_" + obj.id),
                                   layer    = jcanvas.layer(obj.id),
                                   tmpLayer = jcanvas.layer("tmp_" + obj.id);
                               tmpLayer.level('top');
                               var pos_self  = self.position();
                               var startrad = Math.atan2((point.y-pos_self.y), (point.x-pos_self.x)),
                                   baserad  = layer.getAngle();
                               tmpmask.mousemove(function (pos) {
                                                     var nowrad = Math.atan2((pos.y-pos_self.y), (pos.x-pos_self.x));
                                                     var rad    = baserad + (nowrad - startrad);
                                                     layer.rotateTo((rad*180/Math.PI), 0, 0);
                                                     for ( var i = 0; i < crosshair.length; ++i ) {
                                                         crosshair[i].rotateTo((rad*(-180)/Math.PI), point_ch[i], 0);
                                                     }
                                                 });
                               tmpmask.mouseup(function (point) {
                                                   jcanvas.layer("tmp_" + obj.id).del();
                                               });
                           });

            mask.mouseover(function () {
                               jcanvas.layer(obj.id).optns.drag.val=false;  // ドラッグ無効
                           });
            mask.mouseout(function () {
                              jcanvas.layer(obj.id).optns.drag.val=true;    // ドラッグ有効
                          });

            return this;
        };


      //
      //BB_bascoutオブジェクト
      //
        this.BB_bascout = function (_text, _color, _callback) {
            if (_color===undefined) {_color='rgb(255, 0, 165)';}
            this.id=UUID.genV1().toString();

            this.type="bascout";
            this._text=_text;
            this._color=_color;
            this._visible=true;
            //描画して登録。初期座標はとりあえず100づつずらしておく
            this.draw();
            var px_rad  = bbobj.meter_to_pixel(100);
            this.move(px_rad, px_rad);
            this.regist();
            if (typeof(_callback) === "function"){_callback.apply(this);};
        };
        this.BB_bascout.prototype=new this.BB_base();

        this.BB_bascout.prototype.draw = function () {
            var px_wid  = bbobj.meter_to_pixel(500),
                px_len  = bbobj.meter_to_pixel(1200),
                px_back = bbobj.meter_to_pixel(300),
                obj     = this;

            var area    = jcanvas.rect((-1)*px_wid, (-1)*px_back,
                                        2*px_wid,   px_len, this._color, true)
                                 .opacity(0.2).layer(this.id).visible(this._visible),
                areaf   = jcanvas.rect((-1)*px_wid, (-1)*px_back,
                                        2*px_wid,   px_len, this._color, false)
                                 .opacity(1).layer(this.id).visible(this._visible),
                bar     = jcanvas.line([[0,7],[0,25]], this._color)
                                 .lineStyle({lineWidth:2}).layer(this.id),
                arrow   = jcanvas.line([[5,15],[0,25],[-5,15]], this._color, true).layer(this.id),
                center  = jcanvas.circle(0, 0, ptcolsize, this._color, true).layer(this.id),
                centerf = jcanvas.circle(0, 0, ptsize, '#FFFFFF', true).layer(this.id);
                jcanvas.circle(0, 0, pttrasize, 'rgba(0,0,0,0)', true).layer(this.id);

            jcanvas.text(this._text, 0, -10)
                   .align('center').color('#FFFFFF').font('15px sans-serif').layer(this.id);
            jcanvas.layer(this.id).draggable();

            //角度変更処理
            var mdEvent = function(point){
//                              if (jcanvas.layer(obj.id).optns.drag.val==true){return false;}
                              var canvas = jc.canvas(bbobj.id),
                                  tmpmask = jcanvas.rect(0, 0, canvas.width(), canvas.height(), 'rgba(0, 0, 0, 0)')
                                                   .layer("tmp_" + obj.id),
                                  layer    = jcanvas.layer(obj.id),
                                  tmpLayer = jcanvas.layer("tmp_" + obj.id);
                              tmpLayer.level('top');
                              var pos_self = centerf.position();
                              var startrad = Math.atan2((point.y-pos_self.y), (point.x-pos_self.x)),
                                  baserad  = layer.getAngle();
                              tmpmask.mousemove(function (pos) {
                                                    var nowrad = Math.atan2((pos.y-pos_self.y), (pos.x-pos_self.x));
                                                    var rad    = baserad + (nowrad - startrad);
                                                    layer.rotateTo((rad*180/Math.PI), 0, 0);
                                                });
                              tmpmask.mouseup(function (point) {
                                                  tmpLayer.del();
                                              });
                              return true;
                          };
            areaf.mousedown(mdEvent);
            bar.mousedown(mdEvent);
            arrow.mousedown(mdEvent);

            //  ドラッグ無効
            var drugoff = function(){
                              jcanvas.layer(obj.id).optns.drag.val=false;
                          };
            areaf.mouseover(drugoff);
            arrow.mouseover(drugoff);
            bar.mouseover(drugoff);

            //  ドラッグ有効
            var drugon = function(){
                              jcanvas.layer(obj.id).optns.drag.val=true;
                          };
            areaf.mouseout(drugon);
            arrow.mouseout(drugon);
            bar.mouseout(drugon);

            centerf.dblclick(function (){
                                 obj._visible = ! (obj._visible);
                                 area.visible(obj._visible);
                                 areaf.visible(obj._visible);
                             });

            return this;
        };


      //
      //BB_iconオブジェクト
      //
        this.BB_icon = function (_text, _file, _color, _callback) {
            if (_color===undefined) {_color='rgb(0, 255, 255)';}
            this.id=UUID.genV1().toString();

            if ((_file = sanitize_filepath(_file)) == null){
                return null;
            }

            this.type   = "icon";
            this._text  = _text;
            this._file  = _file;
            this._color = _color;

            //描画して登録。初期座標は半径分ずらす
            this._image    = new Image;
            this._image.src=_file+'?'+salt;
            var obj        = this;
            this._image.onload= function () {
                var px_dia = Math.sqrt(Math.pow(obj._image.width,2) + Math.pow(obj._image.height,2));
                obj.draw();
                obj.move(px_dia, px_dia);
                obj.regist();
                if (typeof(_callback) === "function"){_callback.apply(obj);};
                delete this._image;
            };
        };
        this.BB_icon.prototype=new this.BB_base();

        this.BB_icon.prototype.draw = function () {
            var img_width  = this._image.width,
                img_height = this._image.height,
                px_rad     = Math.sqrt(Math.pow(this._image.width,2) + Math.pow(this._image.height,2))*0.5;
            jcanvas.circle(0, 0, px_rad, this._color, true).opacity(0.9).layer(this.id);
            jcanvas.circle(0, 0, px_rad-2, '#FFFFFF', true).layer(this.id);
            jcanvas.circle(0, 0, pttrasize, 'rgba(0,0,0,0)', true).layer(this.id);
            jcanvas.image(this._image, img_width * (-0.5), img_height * (-0.5), img_width , img_height).layer(this.id);
            jcanvas.text(this._text, img_width * 0.5 + 5 , 0)
                   .layer(this.id).color('#FFFFFF').font('15px sans-serif')
                   .align('left').baseline('middle');
            jcanvas.layer(this.id).draggable();

            return this;
        };

      //
      //BB_waftオブジェクト
      //
        this.BB_waft = function (_text, _file, _color, _callback) {
            if (_color===undefined) {_color='rgb(0, 255, 255)';}
            this.id=UUID.genV1().toString();

            if ((_file = sanitize_filepath(_file)) == null){
                return null;
            }

            this.type   = "waft";
            this._text  = _text;
            this._file  = _file;
            this._rad   = 20;  //大ざっぱに全長40m程度?
            this._color = _color;

            //描画して登録。初期座標は半径分ずらす
            this._image    = new Image;
            this._image.src=_file+'?'+salt;
            var obj        = this,
                px_rad     = bbobj.meter_to_pixel(this._rad);
            this._image.onload= function () {
                obj.draw();
                obj.move(px_rad, px_rad);
                obj.regist();
                if (typeof(_callback) === "function"){_callback.apply(obj);};
                delete this._image;
            };
        };
        this.BB_waft.prototype=new this.BB_base();

        this.BB_waft.prototype.draw = function () {
            var px_rad = bbobj.meter_to_pixel(this._rad),
                img_width  = this._image.width,
                img_height = this._image.height,
                img_rate   = px_rad *2 / ((img_width>=img_height)?img_width:img_height);

            img_width  = img_width  * img_rate;
            img_height = img_height * img_rate;

            var handle = jcanvas.circle(0, 0, px_rad + (10 * bbobj.zoomScale), this._color, true).opacity(0.3).layer(this.id);
            jcanvas.circle(0, 0, px_rad, this._color, true).opacity(1).layer(this.id);
            jcanvas.image(this._image, img_width * (-0.5), img_height * (-0.5), img_width , img_height).layer(this.id);
            jcanvas.layer(this.id).draggable();

            //角度変更処理
            var obj   = this,
                layer = jc.layer(this.id),
                canvas = jc.canvas(bbobj.id);

            handle.mousedown(function(point){
                                 var pos_hdl  = handle.position();
                                 // マウスイベントフック用の四角形を最前面に展開
                                 var tmpmask = jcanvas.rect(0, 0, canvas.width(), canvas.height(), 'rgba(0, 0, 0, 0)')
                                                      .layer("tmp_" + obj.id);
                                 jc.layer("tmp_" + obj.id).level('top');

                                 var startrad = Math.atan2((point.y-pos_hdl.y), (point.x-pos_hdl.x)),
                                     baserad  = layer.getAngle();
                                 tmpmask.mousemove(function (pos) {
                                                       var nowrad = Math.atan2((pos.y-pos_hdl.y), (pos.x-pos_hdl.x));
                                                       var rad    = baserad + (nowrad - startrad);
                                                       layer.rotateTo((rad*180/Math.PI), 0, 0);
                                                   });
                                 tmpmask.mouseup(function (point) {
                                                     jcanvas.layer("tmp_" + obj.id).del();
                                                 });
                             });

            handle.mouseover(function () {
                                 layer.optns.drag.val=false;  // ドラッグ無効
                           });
            handle.mouseout(function () {
                                layer.optns.drag.val=true;    // ドラッグ有効
                          });

            return this;
        };

      //
      //BB_freehandオブジェクト
      //
        this.BB_freehand = function ( _text, _color) {
            if (_color===undefined) {_color='rgb(255, 255, 255)';}
            this.id=UUID.genV1().toString();
            this.type    = "freehand";
            this._text   = _text;
            this._color  = _color;
            this._step   = 0;
            this._stepcol   = new Array;
            this._undoCache = new Array;
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
        this.BB_freehand.prototype.move     = this.BB_base.prototype.move;
        this.BB_freehand.prototype.moveTo   = this.BB_base.prototype.moveTo;

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

            if (this._hooker !== undefined) return this;

            // 描画開始時にundoキャッシュをクリア
            this._undoCache.length = 0;

            // マウスイベントフック用の四角形を最前面に展開
            this._hooker=UUID.genV1().toString();
            var hooker = jcanvas.rect(0, 0, canvas.width(), canvas.height(), 'rgba(0, 0, 0, 0)')
                                .layer(this._hooker).level('top');

            hooker.click(function () {return false;});
            hooker.dblclick(function () {return false;});
            hooker.mousemove(function () {return false;});
            hooker.mousedown(function (ptstart) {
                                 //追記したのでundoキャッシュをクリアする
                                 obj._undoCache.length = 0;

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
            // 描画処理中でなければそのまま抜ける
            if (this._hooker === undefined) return this;

            if (this._step != 0) {
                this._undoCache.push({color:this._stepcol[this._step],
                                      points:jc("#" + this._step, {canvas:bbobj.id, layer:this.id}).points()});
                this._stepcol.splice(this._step, 1);
                jc("#" + this._step, {canvas:bbobj.id, layer:this.id}).del();
                this._step--;
            }
            return this;
        };

        this.BB_freehand.prototype.redo = function () {
            // 描画処理中でなければそのまま抜ける
            if (this._hooker === undefined) return this;

            // undoキャッシュにデータがなければそのまま抜ける
            if (this._undoCache.length == 0) return this;

            var cache = this._undoCache.pop();
            this._step++;
            this._stepcol[this._step]=cache.color;
            jcanvas.line(cache.points, cache.color)
                   .layer(this.id).id(this._step).lineStyle({lineWidth:3});

            return this;
        };

        this.BB_freehand.prototype.end = function() {
            // イベントフック用の四角形を消す
            (jc.layer(this._hooker)).del();
            this._hooker = undefined;

            // undoキャッシュをクリア
            this._undoCache.length = 0;

            return this;
        };
    };

    //
    // touchイベントからmouseイベントへのブリッジを設定
    //
    BB.prototype.touchToMouse = function(canvas) {
        var clickthr=5;  // クリックとみなす範囲の閾値

        var touchid=0,mouseoverflag=false,touchflag=false,startX=0,startY=0,clkflag;
        var bbobj=this;

        function getTouch (ev){
            var touch;
            switch (ev.type) {
                case "touchstart":
                    touch   = ev.touches[0];
                    touchid = touch.identifier;
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
                                     (touch.clientX + window.pageXOffset
                                       + document.documentElement.getBoundingClientRect().left),
                                     (touch.clientY + window.pageYOffset
                                       + document.documentElement.getBoundingClientRect().top),
                                     false, false, false, false, 0, null); 
            touch.target.dispatchEvent(event); 
        };

        function pointInObj(touch) {
            var cnvrect = document.getElementById(bbobj.id).getBoundingClientRect();
                 x = touch.clientX - cnvrect.left,
                 y = touch.clientY - cnvrect.top,
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

            //ターレットは個別のオブジェクトとして扱われていないため
            //nameを利用したグループで別途チェックを行う
            if (! result) {
                var targets = jc(".turrets").elements;
                for (var i=0; i<targets.length; i++) {
                    result = targets[i].isPointIn(x,y);
                    if (result) {break;}
                }
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

                                    startX=touch.pageX;
                                    startY=touch.pageY;

                                    clkflag=setTimeout(function(){clkflag=0},300);
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
                                    var clix    = touch.pageX - window.pageXOffset,
                                        cliy    = touch.pageY - window.pageYOffset;

                                    //canvasの枠内ならmousemove、枠外ならmouseout
                                    if (clix > cnvx && cliy > cnvy
                                        && clix < cnvx+width && cliy < cnvy+height) {
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
                                    //タッチ開始からの距離が閾値以下ならクリックイベントも発火
                                    if (Math.abs(startX - touch.pageX)<clickthr
                                        && Math.abs(startY - touch.pageY)<clickthr
                                        && clkflag != 0) {

                                        if (clkflag) clearTimeout(clkflag);
                                        dispatchMouseEvent('click',touch)
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
    BB.prototype.setbg = function(file, dpm, imgscale, callback) {
        var image   = new Image,
            jcanvas = this.jcanvas,
            id      = this.id;
        if (imgscale===undefined) {imgscale=1;};

        if ((file = sanitize_filepath(file)) == null){
            return null;
        }

        image.src=file+'?'+salt;
        image.onload=function() {
            var canvas = document.getElementById(id);
            canvas.width  = image.width*imgscale;
            canvas.height = image.height*imgscale;
            jc.clear(id);
            jcanvas.image(image,0,0,image.width*imgscale,image.height*imgscale).level(-1).id("bg");
            if (callback !== undefined) callback();
            jc.start(id,true);
        };
        this.scale=dpm*imgscale;
        this.imgscale=imgscale;
        this.zoomScale=1;
        this.member={};
    };

    BB.prototype.setbgdiff = function(file) {
        var image    = new Image;
        var jcanvas  = this.jcanvas;
        var id       = this.id;
        var imgscale = this.imgscale;

        if (file) {
            //ファイル指定があれば差分を出力し、即時再描画
            image.src=file+'?'+salt;
            image.onload=function() {
                jcanvas("#bgdiff").del();
                jcanvas.imgdiff(image,0,0,image.width*imgscale,image.height*imgscale)
                      .level(0).id("bgdiff");
                jc.canvas(id).frame();
            };
        } else {
            //空だったら差分を消し、即時再描画
            jcanvas("#bgdiff").del();
            jc.canvas(id).frame();
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


    //ターレット配置
    //
    BB.prototype.put_turret = function (x, y, rot, radius, angle, hookrad, color, test) {
        if (x===undefined) {return undefined;}
        if (y===undefined) {return undefined;}
        if (rot===undefined) {return undefined;}
        if (radius===undefined) {return undefined;}
        if (angle===undefined) {return undefined;}
        if (hookrad===undefined) {hookrad=8;}
        if (color===undefined) {color='rgb(255, 153, 0)';}
        if (test===undefined) {test=false;}

        var visible = false,
            px_rad = bbobj.meter_to_pixel(radius),
            area   = this.jcanvas.sector(x, y, px_rad, angle, color, true)
                                 .rotateTo(rot-90, x, y).opacity(0.3).visible(visible).level(1),
            line   = this.jcanvas.sector(x, y, px_rad, angle, this.color, false).level(1)
                                 .rotateTo(rot-90, x, y).opacity(1).visible(visible),
            hooker = this.jcanvas.circle(x, y, hookrad, 'rgba(0,0,0,0)', true)
                                 .rotateTo(rot-90, x, y).level(3).name("turrets");

        if (test) {
            this.jcanvas.line([[x, y], [x, y-20]], 'rgba(255,255,255,1)')
                        .rotateTo(rot, x, y).lineStyle({lineWidth:2});
            hooker.color('rgba(255,255,255,1)').level('top');
        }

        hooker.mouseover(function(){
                             area.visible(true);
                             line.visible(true);
                         });
        hooker.mouseout(function(){
                             area.visible(visible);
                             line.visible(visible);
                         });
        hooker.click(function(){
                             visible = ! (visible);
                             area.visible(visible);
                             line.visible(visible);
                         });
    };

    //
    //オブジェクト描画
    //
    BB.prototype.add_scout = function (string, radius, length, duration, color, _callback) {
        return new this.BB_scout(string, radius, length, duration, color, _callback);
    };

    BB.prototype.add_sensor = function (string, radius, color, _callback) {
        return new this.BB_sensor(string, radius, color, _callback);
    };

    BB.prototype.add_radar = function (string, radius, angle, color, _callback) {
        return new this.BB_radar(string, radius, angle, color, _callback);
    };

    BB.prototype.add_sonde = function (string, radius1, radius2, color, _callback) {
        return new this.BB_sonde(string, radius1, radius2, color, _callback);
    };

    BB.prototype.add_ndsensor = function (string, radius, color, _callback) {
        return new this.BB_ndsensor(string, radius, color, _callback);
    };

    BB.prototype.add_howitzer = function (string, radius1, radius2, radius3, color, _callback) {
        return new this.BB_howitzer(string, radius1, radius2, radius3, color, _callback);
    };

    BB.prototype.add_bunker = function (string, color, _callback) {
        return new this.BB_bunker(string, color, _callback);
    };

    BB.prototype.add_sentry = function (string, color, _callback) {
        return new this.BB_sentry(string, color, _callback);
    };

    BB.prototype.add_aerosentry = function (string, color, _callback) {
        return new this.BB_aerosentry(string, color, _callback);
    };

    BB.prototype.add_bomber = function (string, color, _callback) {
        return new this.BB_bomber(string, color, _callback);
    };

    BB.prototype.add_bascout = function (string, color, _callback) {
        return new this.BB_bascout(string, color, _callback);
    };

    BB.prototype.add_circle = function (string, radius, color, _callback) {
        return new this.BB_circle(string, radius, color, _callback);
    };

    BB.prototype.add_line = function (string, length, color, _callback) {
        return new this.BB_line(string, length, color, _callback);
    };

    BB.prototype.add_point = function (string, size, color, align, _callback) {
        return new this.BB_point(string, size, color, align, _callback);
    };

    BB.prototype.add_icon = function (string, file, color, _callback) {
        return new this.BB_icon(string, file, color, _callback);
    };

    BB.prototype.add_waft = function (string, file, color, _callback) {
        return new this.BB_waft(string, file, color, _callback);
    };

    BB.prototype.add_freehand = function (text, color) {
        return new this.BB_freehand(text, color);
    };

    //
    //拡大縮小
    //
    BB.prototype.zoom = function (scale) {
        if (scale===undefined) return (this.zoomScale);

        var canvas    = jc.canvas(this.id).cnv,
            baseLayer = jc.canvas(this.id).layers[0];

        //倍率書き換えて、背景レイヤと各オブジェクトの拡大を実施
        this.zoomScale=this.zoomScale * scale;
        baseLayer.scale(scale);

        for (var objid in (this.member)) {
            this.object(objid).applyZoom(scale);
        }

        //キャンバスの大きさを合わせる
        canvas.width  = jc("#bg").getRect().width;
        canvas.height = jc("#bg").getRect().height;
        this.chgScroll();

        jc.canvas(this.id).frame();
        return this;
    };


    BB.prototype.chgScroll = function () {
        jc.canvas(this.id).recalculateOffset();
    };

    global.BB = (global.module || {}).exports = BB;
    if (typeof module !== 'undefined') {
        module.exports = BB;
    }

})(this);