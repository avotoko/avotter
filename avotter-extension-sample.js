/*
 * あぼったー拡張のサンプルです。あぼったーを実行後に拡張スクリプトを実行してください。
 * スクリプト実行方法は次のいずれかです
 * １．開発（デベロッパー）ツールのコンソールにコピペして実行する
 * ２．ブックマークレット化して実行する
 * 自分で拡張を作るとして開発中は方法１で完成したら方法２にするのがいいでしょう
 * 登録した拡張を削除するインターフェースは用意していません。無効化したい場合は同じ名前の空の拡張を登録してください
 * 例えばこのサンプルを無効化するには avotter.addAddon({name: "あぼったー拡張サンプル"}) を実行します
*/

(function(){
	let ng_word_rex;
	function initialize()
	{
		// initialize() は拡張機能を登録したときに一度だけ呼ばれます
		ng_word_rex = new RegExp("あんなこと|こんなこと");
	}
	function hideThisTweet(data, state)
	{
		// あぼったーの処理が終わった後に表示中の各ツイートに対して呼ばれます
		// すでに非表示のツイートに関しては呼ばれません
		if (ng_word_rex.test(data.tweet))
			return true;	// true を返すとこのツイートは非表示になります
	}
	avotter.addAddon({
		name: "あぼったー拡張サンプル", // 同じ名前の拡張は上書きされ後に登録したものが有効になります
		hideThisTweet: hideThisTweet,
		initialize: initialize
	});
})();
