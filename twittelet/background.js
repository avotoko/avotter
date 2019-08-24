/*
 * twittelet/background.js
*/

var csp = {
	"content-security-policy": !0,
	"content-security-policy-report-only": !0,
	"x-content-security-policy": !0,
	"x-content-security-policy-report-only": !0,
	"x-webkit-csp": !0
};

var myPolicy = {
	"script-src": {
		needToRemove: function(src){
			return /^'(nonce|sha256|sha384|sha512)-/i.test(src);
		},
		add: ["'unsafe-inline'"]
	}
};

function modify(value)
{
	let newPolicy = [], modified;
	value.split(";").forEach(dir=>{
		let a = dir.trim().replace(/\s+/g," ").split(" ");
		if (a.length > 0){
			let mypol = myPolicy[a[0].toLowerCase()];
			if (mypol){
				let src = {};
				for (let i = a.length - 1 ; i > 0 ; i--){
					if (mypol.needToRemove(a[i])){
						a.splice(i, 1);
						modified = true;
					}
					else
						src[a[i].toLowerCase()] = true;
				}
				mypol.add.forEach(s=>{
					if (! src[s]){
						a.push(s);
						modified = true;
					}
				});
			}
		}
		newPolicy.push(modified ? a.join(" ") : dir);
	});
	return {modified: modified, value: newPolicy.join(";")};
}

function onHeadersReceived(res) 
{
	let modified;
	for (let i = res.responseHeaders.length - 1 ; i >= 0 ; i--){
		if (csp[res.responseHeaders[i].name.toLowerCase()]){
			let r = modify(res.responseHeaders[i].value);
			if (r.modified){
				res.responseHeaders[i].value = r.value;
				modified = true;
			}
		}
	}
	return modified ? {responseHeaders: res.responseHeaders} : {};
}

browser.webRequest.onHeadersReceived.addListener(
	onHeadersReceived
	,{urls: ["*://twitter.com/*", "*://mobile.twitter.com/*"]}
	,["blocking" ,"responseHeaders"]
);
