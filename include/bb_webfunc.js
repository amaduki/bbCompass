//初期化
var CanvasName = "BBCompass";
var DivName    = "CanvasArea";
var scrollBarWidth=0;
var scrollBarHeight=0;
var freehandOnWrite=undefined;
var bbobj="";

//ターレット関連データ
var turretSpec={"R":[200,180],
                "G":[250,180],
                "M":[250,180],
                "L":[200,180]};
var turretCircle=8;

$(document).ready(function(){
    $("#lst_scout").change(function(){$("#name_scout").val($("#lst_scout option:selected").text());});
    $("#lst_sensor").change(function(){$("#name_sensor").val($("#lst_sensor option:selected").text());});
    $("#lst_radar").change(function(){$("#name_radar").val($("#lst_radar option:selected").text());});
    $("#lst_sonde").change(function(){$("#name_sonde").val($("#lst_sonde option:selected").text());});
    $("#lst_ndsensor").change(function(){$("#name_ndsensor").val($("#lst_ndsensor option:selected").text());});
    $("#lst_howitzer").change(function(){$("#name_howitzer").val($("#lst_howitzer option:selected").text());});
    $("#lst_misc").change(function(){$("#name_misc").val($("#lst_misc option:selected").text());});
    $("#lst_icon").change(function(){$("#name_icon").val($("#lst_icon option:selected").text());});

    var onChgCol=function(){
                     $(this).css('background-color', $(this).val())
                            .css('color', get_fgColor($(this).val()));
                 };
    $('input.colorpick').simpleColorPicker({onChangeColor:onChgCol});
    $('input.colorpick').each(function(){
                                  $(this).bind('change',onChgCol);
                              });
    $('input.colorpick').change();

    var mapobj=$("select#map").children().get();
    $.extend({restoreMaps:function(){
                            $("select#map").children().remove();
                            $("select#map").append(mapobj);
                        }

             });

    $("select#stage").change(function (e){
                           var stage=$("select#stage option:selected").val();
                           $.restoreMaps();
                           $("select#map").children("[data-stage!='"+stage+"']").remove();
                           $("#map").change();
                       });

    $("select#map").change(function (){
                           $("select#map").removeClass("union event scramble");
                           if ($("select#map option:selected").attr("class") !== undefined) {
                               $("select#map").addClass($("select#map option:selected").attr("class"));
                           }
                       });

    // 初回のリセット
    $("#stage").change();

  //メニューのオブジェクト選択
    $("div#objselector div.option").click(function () {
        if ($(this).hasClass("selected")) {
            return false;
        } else {
            $("div#objselector div.option.selected").removeClass("selected");
            $(this).addClass("selected");
        }
        var openid=$(this).attr("data-target");
        $("div.setobj:visible").fadeOut("fast",
                                  function() {
                                       $("div.setobj#"+openid).fadeIn("fast");
                                   });
    });

  //狭い時用メニュー
    $("div.menutab#menutab_map").click(function(ev){
        if ($("div.menucell#menu_map,div.menucell#menu_cont").is(":visible")) {
            $("div.ribbonmenu").fadeOut();
            $("div.menutab").removeClass("selected");
        } else {
            $("div.menutab").removeClass("selected");
            $("div.ribbonmenu").fadeOut("normal",function(){
                $("div.ribbonmenu>*").hide();
                $("div.menucell#menu_map,div.menucell#menu_cont").show();
                $("div.ribbonmenu").fadeIn();
                $("div.menutab#menutab_map").addClass("selected");
            });
        }
    });

    $("div.menutab#menutab_item").click(function(ev){
        if ($("div.menusubcell#subcell_graph").is(":visible")) {
            $("div.ribbonmenu").fadeOut();
            $("div.menutab").removeClass("selected");
        } else {
            $("div.menutab").removeClass("selected");
            $("div.ribbonmenu").fadeOut("normal",function(){
                $("div.ribbonmenu>*").hide();
                $("div.menusubcell#subcell_graph").show();
                $("div.ribbonmenu").fadeIn();
                $("div.menutab#menutab_item").addClass("selected");
            });
        }
    });

  //メニュー部のタッチによるスクロール防止と、独自スクロール処理のbind
    $("header,div.ribbonmenu").bind('touchmove',function(ev){
        ev.preventDefault();
        ev.stopPropagation();
    });
    bindScroll($("div#objselector"));

  //コンテキストメニュー
    $("div.ContextMenu").bind('contextmenu', function(ev){ev.preventDefault()});
    $("div.ContextMenu li.hasChild").bind('click', function(ev){
        if (ev.target == ev.currentTarget) {ev.stopPropagation()}
    });
    $("div#CanvasArea").bind('contextmenu', function(ev) {
        ev.preventDefault();
        var offset   = {top:  ev.pageY,
                        left: ev.pageX};

        //はみ出しそうなら収める
        if (ev.clientY + $("div.ContextMenu").height() > $(window).height() - 3) {
            offset.top = $(window).height() - $("div.ContextMenu").height() + $(window).scrollTop() - 3;
        }

        if (ev.clientX + $("div.ContextMenu").width() > $(window).width() - 3) {
            offset.left = $(window).width() - $("div.ContextMenu").width() + $(window).scrollLeft() - 3;
        }

        $("div.ContextMenu").show()
                            .offset(offset);

        //どこかクリックしたらメニューを消す
        $(document).one('click', function() {
            $("div.ContextMenu,div.ContextMenu div.ContextChild").hide();
        });

    });

    //子メニュー表示部
    $("div.ContextMenu li.hasChild").hover(
        function(ev) {
            var offset = {top:  $(this).offset().top,
                          left: $(this).offset().left + $(this).width() * 0.99};

            if ($(this).offset().top - $(window).scrollTop()
                                      + $(this).children(".ContextChild").height() > $(window).height()) {

                offset.top = $(window).scrollTop() + $(window).height() - $(this).children(".ContextChild").height() - 3;
            }

            if ($(this).offset().left - $(window).scrollLeft()
                                      + $(this).width() * 0.99
                                      + $(this).children(".ContextChild").width() > $(window).width()) {
                offset.left = $(this).offset().left - $(this).children(".ContextChild").width() * 0.99;
            }

            $(this).children(".ContextChild").show()
                                             .offset(offset);
        },
        function(ev) {
            $(this).children(".ContextChild").hide();
        }
    );

  //ズーム
    $("#lst_scale").change(function() {
                               zoom_cnv($(this).val());
                           });

  //changelog
    $.ajax({url     : "./Changelog.txt",
            dataType : 'text',
            cache   : false,
            success : function(txt,status){$("#changelog").val(txt);},
            error   : function(){$("#changelog").val("更新履歴の取得に失敗しました");}
           });

});

//canvas初期化
function initialize(){
    /* canvas要素の存在チェックとCanvas未対応ブラウザの対処 */
    var canvas = document.getElementById(CanvasName);
    if ( ! canvas || ! canvas.getContext ) {
        alert("ブラウザがCanvas非対応なので、このブラウザでは動作しません");
        return false;
    }
    bbobj=new BB(CanvasName);

    var cnvArea = document.getElementById(DivName);
    scrollBarWidth  = cnvArea.offsetWidth - cnvArea.clientWidth;
    scrollBarHeight = cnvArea.offsetHeight - cnvArea.clientHeight+6;
    $("#"+DivName).width($("#"+CanvasName).outerWidth() + scrollBarWidth)
                    .height($("#"+CanvasName).outerHeight() + scrollBarHeight);

    $("#lst_layer").change(function (){bbobj.setbgdiff($("#lst_layer").val())});
    $("#"+DivName).scroll(function(){bbobj.chgScroll();});

  //ウィンドウサイズの変更に対する対処
    $(window).resize(function(){
        //canvasの幅を調整し、jCanvaScriptの処理に反映させる
        chgCanvasSize();
        bbobj.chgScroll();

        //メニューの表示・非表示対処
        if ($("div.menutitle").is(":visible")) {
            //各ブロックをcssのデフォルトに戻す
            $("div.ribbonmenu>div").removeAttr('style');

            //メニュー全体はスイッチを基に表示：非表示を決める
            if ($("span#menusw_on").is(":visible")) {
                $("div.ribbonmenu").hide();
            } else {
                $("div.ribbonmenu").show();
            }
        } else {
            if ($("div.menutab#menutab_map").hasClass("selected")) {
                $("div.menusubcell#subcell_graph").hide();
                $("div.menucell#menu_map,div.menucell#menu_cont").show();
                $("div.ribbonmenu").show();
            } else if ($("div.menutab#menutab_item").hasClass("selected")) {
                $("div.menucell#menu_map,div.menucell#menu_cont").hide();
                $("div.menusubcell#subcell_graph").show();
                $("div.ribbonmenu").show();
            } else {
                $("div.ribbonmenu").hide();
            }

        }
    }); 

  //query stringがあれば再現処理に入る
    if (window.location.search) {
        setURL(window.location.search.substr(1));
    }

}

//マップ変更
function chg_map(callback) {
    var file  = sanitize_filename($("#map option:selected").val());
    var stage = sanitize_filename($("#map option:selected").attr("data-stage"));
    var layer = eval($("#map option:selected").attr("data-layer"));
    var scale = eval($("#stage").children("[value='"+stage+"']").attr("data-scale"));

    if ((file == null) || (stage == null)) {
        alert("マップファイル名エラー");
        return;
    }

    $("div#Loading").show();
    $("#lst_object").children().remove();

    bbobj.setbg("./map/"+stage+"/"+file+".jpg", scale[0], scale[1],
                function(){
                    $("#lst_scale").val(1);
                    $("ul#contextZoom").children("li").removeClass("checked");
                    $("li#contextZoom_1").addClass("checked");
                    $("div#Loading").hide();
                    $.ajax({url           : "data/" + file + ".txt",
                            dataType      : "jsonp",
                            crossDomain   : true,
                            cache         : false,
                            jsonp         : false,
                            jsonpCallback : "stageData",
                            success       : function(data,status){
                                                chgCanvasSize();
                                                var turretData = data["turret"];
                                                for(i=0;i<turretData.length;i++) {
                                                    bbobj.put_turret(turretData[i][0], turretData[i][1], turretData[i][2],
                                                                     turretSpec[turretData[i][3]][0],
                                                                     turretSpec[turretData[i][3]][1],
                                                                     turretCircle,
                                                                     undefined,turretData[i][4]);
                                                }
                                                if (callback !== undefined){callback.call();};
                                            },
                            error         : function(){}
                    });
                });


    $("#lst_layer").children().remove();
    $("#lst_layer").append($('<option value=""></option>').text("通常"));
    for (var i=0;i<layer.length;i++) {
        $("#lst_layer").append($('<option value="./map/'+stage+"/"+file+'_'+ (i+1) +'.jpg'+'"></option>').text(layer[i]));
    }
    $("#lst_layer").val("");

    closeNav();

}

//偵察機
function set_scout() {
    if(! $("#lst_scout").val()) {return;}
    if(! $("#col_scout").val()) {return;}

    var param = eval($("#lst_scout").val());
    var obj = bbobj.add_scout($("#name_scout").val(), param[0], param[1], param[2], $("#col_scout").val());
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}

//センサー
function set_sensor() {
    if(! $("#lst_sensor").val()) {return;}
    if(! $("#col_sensor").val()) {return;}

    var obj = bbobj.add_sensor($("#name_sensor").val(),$("#lst_sensor").val(), $("#col_sensor").val());
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}

//レーダー
function set_radar() {
    if(! $("#lst_radar").val()) {return;}
    if(! $("#col_radar").val()) {return;}

    var param = eval($("#lst_radar").val());
    var obj = bbobj.add_radar($("#name_radar").val(), param[0], param[1], $("#col_radar").val());
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}

//滞空索敵弾
function set_sonde() {
    if(! $("#lst_sonde").val()) {return;}
    if(! $("#col_sonde").val()) {return;}

    var param = eval($("#lst_sonde").val());
    var obj = bbobj.add_sonde($("#name_sonde").val(), param[0], param[1], $("#col_sonde").val());
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}

//ND索敵センサー
function set_ndsensor() {
    if(! $("#lst_ndsensor").val()) {return;}
    if(! $("#col_ndsensor").val()) {return;}

    var obj = bbobj.add_ndsensor($("#name_ndsensor").val(), $("#lst_ndsensor").val(), $("#col_ndsensor").val());
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}

//砲撃
function set_howitzer(){
    if(! $("#lst_howitzer").val()) {return;}
    if(! $("#col_howitzer").val()) {return;}

    var param = eval($("#lst_howitzer").val());
    var obj = bbobj.add_howitzer($("#name_howitzer").val(), param[0], param[1], param[2], $("#col_howitzer").val());
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}


//その他攻撃関連
function set_misc() {
    if(! $("#lst_misc").val()) {return;}
    if(! $("#col_misc").val()) {return;}

    var obj;
    switch($("#lst_misc").val()) {
        case "bunker":  //サテライトバンカー
            obj = bbobj.add_bunker($("#name_misc").val(),$("#col_misc").val());
            break;

        case "sentry":  //先生
            obj = bbobj.add_sentry($("#name_misc").val(),$("#col_misc").val());
            break;

        case "aerosent":  //先生
            obj = bbobj.add_aerosentry($("#name_misc").val(),$("#col_misc").val());
            break;

        case "bomber":  //爆撃通信機
            obj = bbobj.add_bomber($("#name_misc").val(),$("#col_misc").val());
            break;

        case "bascout":  //偵察要請装置
            obj = bbobj.add_bascout($("#name_misc").val(),$("#col_misc").val());
            break;

    }
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}


//アイコン
function set_icon(){
    if(! $("#lst_icon").val()) {return;}
    if(! $("#col_icon").val()) {return;}

    var file  = sanitize_filename($("#lst_icon").val());
    if (file == null) {
        alert("アイコンファイル名エラー");
        return;
    }

    var obj = bbobj.add_icon($("#name_icon").val(), file, $("#col_icon").val());
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}


//ワフトローダー
function set_waft(file) {
    if(! file) {return;}
    if(! $("#col_waft").val()) {return;}

    file  = sanitize_filename(file);
    if (file == null) {
        alert("ワフト画像ファイル名エラー");
        return;
    }

    var obj = bbobj.add_waft($("#name_waft").val(), file, $("#col_waft").val());
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}


//円
function set_circle(){
    if(! $("#rad_circle").val()) {return;}
    if(! $("#col_circle").val()) {return;}

    var obj = bbobj.add_circle($("#name_circle").val(), $("#rad_circle").val(), $("#col_circle").val());
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}

//直線
function set_line(){
    if(! $("#len_line").val()) {return;}
    if(! $("#col_line").val()) {return;}

    var obj = bbobj.add_line($("#name_line").val(), $("#len_line").val(), $("#col_line").val());
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}

//点
function set_point(){
    var obj = bbobj.add_point($("#name_point").val(), $("#size_point").val(), $("#col_point").val(), $("#align_point").val());
    closeNav();

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        obj.move($("#"+DivName).scrollLeft(),$("#"+DivName).scrollTop());
        obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
    }
}

//フリーハンド
function set_freehand(){
    var obj = bbobj.add_freehand($("#name_freehand").val(), $("#col_freehand").val());

    if (obj) {
        add_object(obj.id, coalesce_name(obj));
        $("button").attr("disabled",true);
        obj.start();
        freehandOnWrite = obj;
        var colChg =function(){
                        obj.color($(this).val());
                    }
        $("#col_freehand").bind('blur',colChg);
        $("#undo_freehand").attr("disabled", false)
                           .click(function(){freehandOnWrite.undo();});
        $("#redo_freehand").attr("disabled", false)
                           .click(function(){freehandOnWrite.redo();});
        $("#stop_freehand").attr("disabled", false)
                           .click(function(){
                                      freehandOnWrite=undefined;
                                      obj.end();
                                      $("#col_freehand").unbind('blur',colChg);
                                      $("button:not(.disable)").attr("disabled",false);
                                      $("#stop_freehand").attr("disabled", true).unbind("click");
                                      $("#undo_freehand").attr("disabled", true).unbind("click");
                                      $("#redo_freehand").attr("disabled", true).unbind("click");
                                  });
    }
}

//ズーム
function zoom_cnv(scale){
    var newScale,chgScale,
        canvas = document.getElementById(CanvasName);

    newScale = scale;
    $("#lst_scale").val(newScale);

    liid=newScale.toString().replace(".","_");
    $("ul#contextZoom").children("li").removeClass("checked");
    $("li#contextZoom_" + liid).addClass("checked");

    var chgScale = newScale/bbobj.zoomScale;
    if (bbobj.zoomScale != newScale) {
        //倍率が変化する場合は左上維持して拡大処理
        bbobj.zoom(chgScale);
        $("#"+DivName).scrollLeft($("#"+DivName).scrollLeft()*chgScale)
                      .scrollTop($("#"+DivName).scrollTop()*chgScale);
    }
}

//移動開始
function start_move(){
    $("button").attr("disabled",true);
    $("li#contextSelectMode").removeClass("checked");
    $("li#contextMoveMode").addClass("checked");
    $("div#csr_select").removeClass("selected");
    $("div#csr_move").addClass("selected");
    $("canvas#"+CanvasName).css("cursor","move");

    if (freehandOnWrite !== undefined) {
        freehandOnWrite.end();
    }

    bbobj.jcanvas.pause(CanvasName);
    var md,mm,mu,
        base_x,base_y;

    mm = function(e) {
                 var dx = e.pageX-base_x, dy = e.pageY-base_y;
                 $("#"+DivName).scrollLeft($("#"+DivName).scrollLeft()-dx);
                 $("#"+DivName).scrollTop($("#"+DivName).scrollTop()-dy);
                 base_x=e.pageX;
                 base_y=e.pageY;
                 return false;
         };

    mu = function(e) {
             $("#"+DivName).unbind('mousemove', mm);
             $("#"+DivName).unbind('mouseup', mu);
             return false;
         };
    md = function (e) {
             base_x = e.pageX;
             base_y = e.pageY;
             $("#"+DivName).bind('mousemove', mm);
             $("#"+DivName).bind('mouseup', mu);
             return false;
         };

    $("#"+DivName).mousedown(md);

}

//移動終了
function stop_move(){
    $("button:not(.disable)").attr("disabled",false);
    $("li#contextSelectMode").addClass("checked");
    $("li#contextMoveMode").removeClass("checked");
    $("div#csr_select").addClass("selected");
    $("div#csr_move").removeClass("selected");
    $("canvas#"+CanvasName).css("cursor","auto");

    bbobj.jcanvas.start(CanvasName, true);
    $("#"+DivName).unbind('mousedown');

    //力技なのが気になる
    if (freehandOnWrite !== undefined) {
        $("button").attr("disabled",true);
        freehandOnWrite.start();
        $("#stop_freehand").attr("disabled", false);
    }
}

//lst_objectへの追加
function add_object(id, name) {
    if ($("#lst_object").children("option").get().length) {
        $('<option value="'+id+'"></option>').text(name).insertBefore($("#lst_object :first-child"));
    } else {
        $("#lst_object").append($('<option value="'+id+'"></option>').text(name));
    }
    $("#lst_object").val(id);
}

//lst_objectを上に
function up_object() {
    $("#lst_object option:not(:selected)").each(function(){
        while($(this).next().is(":selected")){
            $(this).insertAfter($(this).next());
            bbobj.object($(this).val()).down();
        }
    });
}

//lst_objectを下に
function down_object() {
    $($("#lst_object option:not(:selected)").get().reverse()).each(function(){
        while($(this).prev().is(":selected")){
            $(this).insertBefore($(this).prev());
            bbobj.object($(this).val()).up();
        }
    });
}

//メニュー隠す
function hide_menu() {
    $("div.ribbonmenu").slideUp(
        function(){
            $("#menusw_off").hide();
            $("#menusw_on").show();
    });
}

//メニュー出す
function show_menu() {
    $("div.ribbonmenu").slideDown(
        function(){
            $("#menusw_on").hide();
            $("#menusw_off").show();
    });
}

//lst_objectから要素削除
function del_object() {
    $("#lst_object option:selected").each(function(){
        bbobj.object($(this).val()).del();
        $(this).remove()});
}

//画像保存
function saveImg() {
    $("#WorkArea").append($("<img id=DownloadImg src='"+bbobj.save()+"'>"));
    window.open("./image.html","test");
}

//現在の状態をURL化
function getURL() {
    var objs  = new Array();
    $($("#lst_object option").get().reverse()).each(function(){
        objs.push($(this).val());
    });

    var queryobj=new BBCQuery(bbobj, $("select#map").val());
    queryobj.getObjects(objs);
    var querystr = queryobj.getQueryString(),
        baseurl  = location.protocol + '//' + location.host + location.pathname + '?' + querystr;

    if (baseurl.match(/^https?:\/\//)) {
        $.ajax({
            type: 'GET',
            url: 'http://is.gd/create.php',
            dataType: 'jsonp',
            crossDomain   : true,
            cache         : false,
            jsonp         : false,
            data: {
                      url         : baseurl,
                      format      : "json",
                      callback    : "shortenurl",
                  },
            jsonpCallback: 'shortenurl',
            success: function(data,status){
                         if (! data["errorcode"]) {
                             window.prompt("表示用URL",data["shorturl"]);
                         } else {
                             alert("URL短縮エラー(" & data["errorcode"] & ")");
                         }
                     },
            error: function(){
                       alert("URL短縮に失敗しました");
                   }
        });
    } else {
        window.prompt( "表示用URL" , baseurl );
    }

    delete queryobj;
}

//URLクエリストリングからの復元
function setURL(querystr) {
        var queryobj=new BBCQuery(bbobj, 'dummy');

        if (queryobj.setQueryString(querystr)) {
            $.restoreMaps();
            $("select#stage").val($("select#map").children("[value='"+queryobj.map+"']").attr("data-stage"));
            $("select#stage").change();

            $("select#map").val(queryobj.map);
            $("select#map").change();

            chg_map(function(){
                var objs;
                objs=queryobj.setObjects.apply(queryobj);
                for (var i=0;i<objs.length;i++) {
                    add_object(objs[i].id, coalesce_name(objs[i]));
                    var obj=objs[i];
                    obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
                }
            });
        }

        delete queryobj;
}

//オブジェクトの名前が空白だった場合の対策関数
function coalesce_name(obj){
    var name;

    if (obj._text.length != 0) {
        //名前指定がある場合はそのまま利用
        name= obj._text;
    } else {
        //名前指定がないので、種別に応じた仮の名前を利用
        switch ( obj.type ) {
        case 'scout':
            name = "(偵察機)";
            break;

        case 'sensor':
            name = "(センサー)";
            break;

        case 'radar':
            name = "(レーダー)";
            break;

        case 'sonde':
            name = "(索敵弾)";
            break;

        case 'ndsensor':
            name = "(ND)";
            break;

        case 'howitzer':
            name = "(榴弾)";
            break;

        case 'bunker':
            name = "(バンカー)";
            break;

        case 'sentry':
            name = "(セントリー)";
            break;

        case 'aerosentry':
            name = "(エアロセントリー)";
            break;

        case 'bomber':
            name = "(爆撃機)";
            break;

        case 'bascout':
            name = "(偵察要請)";
            break;

        case 'icon':
            name = "(アイコン)";
            break;

        case 'waft':
            name = "(ワフトローダー)";
            break;

        case 'circle':
            name = "(円)";
            break;

        case 'line':
            name = "(直線)";
            break;

        case 'point':
            name = "(点)";
            break;

        case 'freehand':
            name = "(フリーハンド)";
            break;

        default:
            name= "(無名)";
            break;
        }
    }

    return name;
}

//前景色を得る
function get_fgColor($bgcol) {
   if ($bgcol.search(/#[0-9a-fA-F]{6}/) == -1) return ("#000000") ;

    $r = parseInt($bgcol.substr(1, 2),16);
    $g = parseInt($bgcol.substr(3, 2),16);
    $b = parseInt($bgcol.substr(5, 2),16);

    $bright = (($r*299)+($g*587)+($b*114))/1000;
    if( $bright < 127.5 ) {
        return ("#FFFFFF");
    }
    return ("#000000");
}

//ファイル名・ディレクトリ名チェック
function sanitize_filename(path) {
        var control_codes = /[\u0000-\u001F\u007F-\u009F]/g;
        path.replace(control_codes, "\uFFFD");
        if(path.match(/^([.~]?\/)?([A-Za-z0-9_-][A-Za-z0-9_.-]+\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]+$/)){
            return path;
        } else {
            return null;
        }
}

//キャンバスエリアが画面幅を超えないように調整
function chgCanvasSize () {
    if ( $("canvas#"+CanvasName).outerWidth() <= $('body').innerWidth()) {
        $("div#"+DivName).width($("canvas#"+CanvasName).outerWidth() + scrollBarWidth)
                      .height($("canvas#"+CanvasName).outerHeight() + scrollBarHeight);
    } else {
        $("div#"+DivName).width("100%")
                      .height($("canvas#"+CanvasName).outerHeight() + scrollBarHeight);
    }
    bbobj.chgScroll();
}

//ナヴィゲーションタブエリアを非表示にする
function closeNav() {
    if ($("nav").is(":visible")) {
        $("nav>div").removeClass("selected");
        $("div.ribbonmenu").fadeOut();
    }
}

//スクロール関連独自処理
function bindScroll(ojQuery) {
    ojQuery.each(function(i, elem) {
        elem.addEventListener ('wheel',
                               function(e) {
                                   if ((e.deltaX < 0) && (elem.scrollLeft <= 0)
                                       || (e.deltaX > 0) && (elem.scrollLeft >= elem.scrollWidth - elem.clientWidth)
                                       || (e.deltaY < 0) && (elem.scrollTop <= 0)
                                       || (e.deltaY > 0) && (elem.scrollTop >= elem.scrollHeight - elem.clientHeight)) {
                                       e.preventDefault();
                                       return false;
                                   }

                                   if (e.deltaMode == 0) {
                                       elem.scrollLeft = elem.scrollLeft + e.deltaX;
                                       elem.scrollTop  = elem.scrollTop + e.deltaY;
                                   } else if (e.deltaMode == 1){
                                       elem.scrollLeft = elem.scrollLeft + e.deltaX * element.style.lineHeight;
                                       elem.scrollTop  = elem.scrollTop + e.deltaY * element.style.lineHeight;
                                   } else if (e.deltaMode == 2){
                                       elem.scrollLeft = elem.scrollLeft + e.deltaX * document.pageX;
                                       elem.scrollTop  = elem.scrollTop + e.deltaY * document.pageY;
                                   } else {
                                       return true;
                                   }
                                   e.preventDefault();
                                   return true;
                               },
                               false);

        if (window.TouchEvent) {
            var startX,startY,scrollStartX,scrollStartY,scrollLimitX,scrollLimitY,
                flag,touchid;

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
                }

                if (touch===undefined) {
                    return undefined;
                }
                return touch;
            }

            elem.addEventListener ('touchstart',
                                    function(e){
                                        var touch=getTouch(e);

                                        flag=true;
                                        startX=touch.clientX;
                                        startY=touch.clientY;
                                        scrollStartX=elem.scrollLeft;
                                        scrollStartY=elem.scrollTop;
                                        scrollLimitX=elem.scrollWidth - elem.clientWidth;
                                        scrollLimitY=elem.scrollHeight - elem.clientHeight;
                                        return false;
                                    },
                                    false);

            elem.addEventListener('touchmove',
                                  function(e){
                                      //touchstartで拾ったタッチが見つからなければ抜ける
                                      if (! flag) return false;

                                      var touch=getTouch(e);
                                      if (touch === undefined) {
                                          flag=false;
                                          return false
                                      }

                                      e.preventDefault();
                                      var newX = scrollStartX + (touch.clientX - startX) * (-1),
                                          newY = scrollStartY + (touch.clientY - startY) * (-1);
                                      if (newX < 0) newX=0;
                                      if (newX > scrollLimitX) newX=scrollLimitX;
                                      elem.scrollLeft=newX

                                      if (newY < 0) newY=0;
                                      if (newY > scrollLimitY) newY=scrollLimitY;
                                      elem.scrollTop=newY
                                  },
                                  false);

            elem.addEventListener('touchend',
                                  function(e){
                                      flag=false;
                                  });
        }
    });
}
