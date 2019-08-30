/*
 * あぼったー拡張の hideThisTweet に渡される引数 data の内容を表示します
 * 開発（デベロッパー）ツールのコンソールにコピペして実行してみてください
 * この拡張を無効化するには avotter.addAddon({name: "あぼったー拡張引数表示"}) を実行します
*/

(function(){
	function quote(s)
	{
		return typeof s === "string" ? ('"' + s.replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/"/g,"\\\"") + '"') : s.toString();
	}
	
	function hideThisTweet(data, state)
	{
		console.log("{");
		Object.keys(data).forEach(k=>{
			console.log("    " + k + ": " + quote(data[k]));
		});
		console.log("}");
	}
	
	avotter.addAddon({
		name: "あぼったー拡張引数表示",
		hideThisTweet: hideThisTweet
	});
})();
