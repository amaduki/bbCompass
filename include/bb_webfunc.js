//初期化
var CanvasName="BBCompass";
var bbobj="";

$(document).ready(function(){
    $("#lst_scout").change(function(){$("#name_scout").val($("#lst_scout option:selected").text());});
    $("#lst_sensor").change(function(){$("#name_sensor").val($("#lst_sensor option:selected").text());});
    $("#lst_radar").change(function(){$("#name_radar").val($("#lst_radar option:selected").text());});
    $("#lst_howitzer").change(function(){$("#name_howitzer").val($("#lst_howitzer option:selected").text());});

    var mapobj=$("#map").children().get();
    $("#stage").change(function (){
                           var stage=$("#stage option:selected").val();
                           $("#map").children().remove();
                           $("#map").append(mapobj);
                           $("#map").children("[class!='"+stage+"']").remove();
                       });
    $("#stage").change();

  //タブメニュー
    $("li.graphtab").click(function () {
        if ($(this).hasClass("active")) {
            return false;
        }
        $("li.active").removeClass("active");
        $(this).addClass("active").removeClass("hover");
        var openid=$(this).attr("data-target");
        $("div.graphmenu:visible").fadeOut("fast",
                                  function() {
                                       $("#"+openid).fadeIn("fast");
                                   });
    });
    $("li.graphtab").mouseover(function () {
        if ($(this).hasClass("active")) {
            return false;
        }
        $(this).addClass("hover");
    });

    $("li.graphtab").mouseout(function () {
        $(this).removeClass("hover");
    });

  //changelog
    $.ajax({url     : "./Changelog.txt",
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

    $("#lst_layer").change(function (){bbobj.setbgdiff($("#lst_layer").val())});

}

//マップ変更
function chg_map() {
    $("#lst_object").children().remove();
    var file  = $("#map option:selected").val();
    var stage = $("#map option:selected").attr("class");
    var layer = eval($("#map option:selected").attr("data-layer"));
    var scale = eval($("#stage").children("[value='"+stage+"']").attr("data-scale"));
    var salt  = "?" + new Date().getTime();
    bbobj.setbg("./image/"+file+".jpg" + salt, scale[0], scale[1]);

    $("#lst_layer").children().remove();
    $("#lst_layer").append($('<option value=""></option>').text("通常"));
    for (var i=0;i<layer.length;i++) {
        $("#lst_layer").append($('<option value="./image/'+file+'_'+ (i+1) +'.jpg'+salt+'"></option>').text(layer[i]));
    }
    $("#lst_layer").val("");
}

//偵察機
function set_scout() {
    if(! $("#lst_scout").val()) {return;}
    if(! $("#name_scout").val()) {return;}

    var param = eval($("#lst_scout").val());
    var obj = bbobj.add_scout($("#name_scout").val(), param[0], param[1], param[2]);
    add_object(obj.id, $("#name_scout").val());
    obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
}

//センサー
function set_sensor() {
    if(! $("#lst_sensor").val()) {return;}
    if(! $("#name_sensor").val()) {return;}

    var obj = bbobj.add_sensor($("#name_sensor").val(),$("#lst_sensor").val());
    add_object(obj.id, $("#name_sensor").val());
    obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
}

//レーダー
function set_radar() {
    if(! $("#lst_radar").val()) {return;}
    if(! $("#name_radar").val()) {return;}

    var param = eval($("#lst_radar").val());
    var obj = bbobj.add_radar($("#name_radar").val(), param[0], param[1]);
    add_object(obj.id, $("#name_radar").val());
    obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
}

//砲撃
function set_howitzer(){
    if(! $("#lst_howitzer").val()) {return;}
    if(! $("#name_howitzer").val()) {return;}

    var param = eval($("#lst_howitzer").val());
    var obj = bbobj.add_howitzer($("#name_howitzer").val(), param[0], param[1], param[2]);
    add_object(obj.id, $("#name_howitzer").val());
    obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
}


//円
function set_circle(){
    if(! $("#rad_circle").val()) {return;}
    if(! $("#name_circle").val()) {return;}

    var obj = bbobj.add_circle($("#name_circle").val(),$("#rad_circle").val());
    add_object(obj.id, $("#name_circle").val());
    obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
}

//直線
function set_line(){
    if(! $("#len_line").val()) {return;}
    if(! $("#name_line").val()) {return;}

    var obj = bbobj.add_line($("#name_line").val(),$("#len_line").val());
    add_object(obj.id, $("#name_line").val());
    obj.mousedown(function(){$("#lst_object").val(obj.id);return false;});
}

//フリーハンド
function set_freehand(){
    var obj = bbobj.add_freehand($("#col_freehand").val());
    add_object(obj.id, $("#name_freehand").val());
    $("button").attr("disabled",true);
    obj.start();
    $("#stop_freehand").attr("disabled", false)
                       .click(function(){
                                  obj.end();
                                  $("#col_freehand").change(function(){});
                                  $("button").attr("disabled",false);
                                  $("#stop_freehand").attr("disabled", true).unbind("click");
                                  $("#col_freehand").unbind("change");
                              });

    $("#col_freehand").change(function(){
                                  obj.color($(this).val());
                              });

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

//lst_objectから要素削除
function del_object() {
    $("#lst_object option:selected").each(function(){
        bbobj.object($(this).val()).del();
        $(this).remove()});
}

//画像保存
function save() {
    $("#WorkArea").append($("<img id=DownloadImg src='"+bbobj.save()+"'>"));
    window.open("./image.html","test");
}
