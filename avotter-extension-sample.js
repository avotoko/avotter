/*
 * あぼったー拡張サンプル v.0.1.1
 * あぼったー拡張のサンプルです。あぼったーを実行後に拡張スクリプトを実行してください。
 * スクリプト実行方法は次のいずれかです
 * １．開発（デベロッパー）ツールのコンソールにコピペして実行する
 * ２．ブックマークレット化して実行する
 * 自分で拡張を作るとして開発中は方法１で完成したら方法２にするのがいいでしょう
 * 登録した拡張を削除するインターフェースは用意していません。無効化したい場合は同じ名前の空の拡張を登録してください
 * 例えばこのサンプルを無効化するには avotter.addAddon({name: "あぼったー拡張サンプル"}) を実行します
*/

(function(){
	let infoAreaClassName = "avotter-extension-information-area";
	let ng_word_rex;
	
	// ツイートはこの関数で取得されるエレメントの子として挿入・削除されます
	function getTweetsContainer()
	{
		return document.querySelector('div[data-testid="primaryColumn"] h1[aria-level="1"] + div > div:first-child > div:first-child');
	}

	function initialize()
	{
		// initialize() は拡張機能を登録したときに一度だけ呼ばれます
		ng_word_rex = new RegExp("あんなこと|こんなこと");
		
		// 情報を表示するための領域をwindow右下隅に作ります
		let e = document.querySelector('.'+infoAreaClassName);
		if (! e){
			e = document.createElement("div");
			e.innerHTML = '<span class="'+infoAreaClassName+'">n/a</span>';
			e.setAttribute("style","position:fixed;right:5px;bottom:5px;z-index:10;background-color:lime");
			document.body.appendChild(e);
		}
	}
	
	let counter = 0;

	function modulo(n, m)
	{
		return n - Math.floor(n / m) * m;
	}

	function hideThisTweet(data, state)
	{
		// あぼったーの処理が終わった後に表示中の各ツイートに対して呼ばれます
		// すでに非表示のツイートに関しては呼ばれません
		
		/*
			連続して大量に非表示にするとドキュメント内にツイートが 500 とか 1000
			とか蓄積して動作が重くなる場合があります
			参考になるようドキュメント内のツイート数（概数）を表示する方法を示します
			2回に1回ドキュメント中のツイート数（表示／非表示を合わせた数）表示を更新します
			剰余演算子（パーセント記号）はブックマークレット化で問題を起こすのでmodulo関数を使います
		*/
		if (modulo(counter++, 2) === 0){ 
			let tc = getTweetsContainer();
			tc && (e = document.querySelector('.'+infoAreaClassName)) && (e.innerText = tc.children.length);
		}

		if (ng_word_rex.test(data.tweet))
			return true;	// true を返すとこのツイートは非表示になります
	}
	
	avotter.addAddon({
		name: "あぼったー拡張サンプル", // 同じ名前の拡張は上書きされ後に登録したものが有効になります
		hideThisTweet: hideThisTweet,
		initialize: initialize
	});
})();
