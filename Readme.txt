----
BBコンパスもどき

製作者：暇人@BB
サイト：http://bbcompass.web.fc2.com/
配布元：http://ux.getuploader.com/bbcompass/
開発室：http://bbcompass.blog.fc2.com/
----

○使い方
  (1)利用方法
    ダウンロードしたものをそのままどこかに展開して、
    HTML5とJavascriptに対応したブラウザでindex.htmlを開いてください。
    FirefoxとかChromeとかIEの9以上とかならたぶん動きます。
    操作はおおむねRangeCheckerやABCと同じなので、適宜触って覚えてください。

    ただし、自分のPCにダウンロードしたファイルをそのまま開いている場合、
    セキュリティ警告の都合で画像保存機能が使えない場合があるようです。
    これはPC内部でのデータやり取りについて、制限がかかっているためです。

    下記の方法で回避できますが、セキュリティレベルが低下します。
    実施する場合は自己責任でお願いいたします。

    IEの場合
      起動時と画像を保存する際にセキュリティ警告が出るので、許可する。

    Firefoxの場合 
      about:config から、security.fileuri.strict_origin_policy を false に設定する

    Google Chromeの場合 
      起動オプションに「--allow-file-access-from-files」を付加する


  (2)流用について
    ダウンロードしたデータをどこかで公開したいという場合、
    どこかのサーバにアップロードすればそのままWeb公開できます。
    ただし、本ツールをアップロードしたことによる損害等について、
    開発者は責任を負いませんので、その点はご了承ください。


  (3)改造について
    もし本ツールの改造を考えておみえの場合、
    簡単な資料がReference.txtにまとめてあるので、そちらをお読みください。


○ライセンスとか再配布とか
  (1)本ツールのライセンスと再配布について
    私が開発した部分については、MITライセンスを採用いたします。
    正式なライセンス文書は同梱されているLicense.txtですが、
    以下の概要に従って頂ければ、まず問題はありません。

    ・本ツールの動作については、何の保障もありません。

    ・再配布、再利用、改造については自由に行って頂いて構いませんが、
      再配布に際しては著作者とライセンスを明示する必要があります。
      （といっても、Licence.txtを添付して頂くだけでOKです）

    ・改造版は「改造した人の著作物」となりますが、
      その扱いについて、私からは何の制限もいたしません。
      ライセンス形態や再配布の扱いも含め、改造した方が自由に決定できます。

  (2)本ツールが利用するライブラリとその再配布について
    本ツールは下記のライブラリを利用しており、
    それぞれのライセンスに基づいて再配布を行っています。
    (jQueryとJcanvaScriptはデュアルライセンスですが、MIT Licenseに従います)

    ・jQuery  http://jquery.com/
      MIT License or the GNU General Public License (GPL) Version 2

    ・UUID.js  https://github.com/LiosK/UUID.js
      MIT License

    ・JcanvaScript  http://jcscript.com/
      MIT License or the GNU General Public License (GPL) Version 2

      ※一部機能においてJcanvaScriptの内部変数を参照、書き換えしています。
        JcanvaScriptのバージョンを上げるとうまく動かなくなる可能性があります。

    また、下記のライブラリについては私家改造版を利用しています。
    この場合の著作権の扱いは今一つわかりませんが（改造部分のみ私の著作物？）
    基本的にはそれぞれのライセンスに従って取り扱います

    ・simpleColorPicker jQuery plugin  http://rachel-carvalho.github.com/simple-color-picker/
      MIT License

    ・js-deflate  https://github.com/dankogai/js-deflate
      the GNU General Public License (GPL) Version 2

      ※base64.jsについても一部を変更し、bb_query.jsに取り込んでいます


  (3)マップ画像について
    マップ画像の著作権は株式会社 セガが保有しています。
    Webサイトへの掲載、転用は著作物利用規約で許可されていますので、
    Web版での画像利用は特に問題ないと思います。

    しかし、ダウンロード版の再配布が「転用」にあたるかどうかは微妙です。
    将来的に、画像を同梱しない形でダウンロード版の配布を行い、
    地図画像は各自BB.Netから入手して頂く形になるかもしれませんが、
    その際はどうかご容赦ください。   