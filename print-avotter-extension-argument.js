/*
 * あぼったー拡張引数表示 v.0.1.1
 * あぼったー拡張の hideThisTweet に渡される引数 data の内容を表示します
 * 開発（デベロッパー）ツールのコンソールにコピペして実行してみてください
 * この拡張を無効化するには avotter.addAddon({name: "あぼったー拡張引数表示"}) を実行します
*/

(function(){
	function log(s, css)
	{
		console.log.apply(console, arguments);
	}

	function quote(s)
	{
		return '"' + s.replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/"/g,"\\\"") + '"';
	}
	
	function printObject(obj, depth)
	{
		if (depth == null)
			depth = 0;
		depth === 0 && log("{");
		function indent(){return "    ".repeat(depth+1)}
		Object.keys(obj).forEach(k=>{
			function pre(){return indent() + k + ": "}
			let v = obj[k];
			if (v === null)
				log(pre() + "null");
			else if (typeof v === "string")
				log(pre() + quote(v));
			else if (typeof v === "object" && v.constructor.name === "Object")
				log(pre() + "{"), printObject(v, depth+1), log(indent() + "}");
			else
				log(pre() + v.toString());
		});
		depth === 0 && log("}");
	}

	avotter.addAddon({
		name: "あぼったー拡張引数表示",
		hideThisTweet: function (data, state){
			printObject(data);
		}
	});
})();
