/*
{
	name: Avotter
	version: 0.4.5
	author: avotoko
	description: Improve the usability of twitter.com (new design of 2019)
}
*/
(function(){
	let d = document, AVOTTER_VERSION_STRING = 'v.0.4.5';

	//===============================================================
	// Helpers
	//===============================================================
	function e2str(e)
	{
		if (e == null)
			return "null";
		if (e.tagName == null)
			return "("+(e.nodeName ? e.nodeName : "n/a")+")";
		var s = e.tagName+(e.id?("#"+e.id):"");
		var className = e.className.baseVal != null ? e.className.baseVal : e.className;
		if (className){
			var a = className.split(" ");
			for (var i = 0 ; i < a.length ; i++){
				if (a[i])
					s += "." + a[i];
			}
		}
		return s;
	}
	
	function o2str(o)
	{
		if (o){
			let s = "";
			Object.keys(o).forEach(k=>s += ","+k+":"+o[k]);
			return s ? "{" + s.substring(1) + "}" : "{}";
		}
		else {
			return "null";
		}
	}

	function isHidden(e)
	{
		return ! e.offsetParent;
	}
	
	function isVisible(e)
	{
		return !! e.offsetParent;
	}
	
	function isAscendant(parent, e)
	{
		while (e.parentElement){
			if (e.parentElement === parent)
				return true;
			e = e.parentElement;
		}
		return false;
	}
	
	function containsElement(e, selector)
	{
		return (e != null && e.querySelector) ? e.querySelector(selector) : null;
	}

	function containsElementInNodeList(ee, selector)
	{
		if (ee != null && ee.constructor && ee.constructor.name === "NodeList"){
			for (let i = 0 ; i < ee.length ; i++){
				let e = containsElement(ee[i], selector);
				if (e)
					return e;
			}
		}
		return null;
	}
	
	function appendStylesheet(rules, id)
	{
		let e = d.createElement("style");
		if (id)
			e.id = id;
		e.type = "text/css";
		e.innerHTML = rules;
		d.getElementsByTagName("head")[0].appendChild(e);
	}
	
	function addObjectMethodMonitor(obj, name, monitor)
	{
		if (obj && obj[name] && typeof monitor === "function"){
			let original = "avtr_original_" + name, monitors = "avtr_"+name+"_monitors", id = Date.now();
			if (! obj[original]){
				if (obj[name].toString().replace(/\s+/g," ") !== "function "+name+"() { [native code] }"){
					// Someone hooking. Avoids conflicts.
					log("## "+obj.constructor?obj.constructor.name:"obj"+"."+name+" already hooked");
					return;
				}
				obj[original] = obj[name];
				obj[name] = function(){
					Object.keys(obj[monitors]).forEach(k=>obj[monitors][k].apply(this, arguments));
					return obj[original].apply(this, arguments);
				};
				obj[monitors] = {};
			}
			obj[monitors][id] = monitor;
			return {
				obj: obj,
				original: original,
				monitors: monitors,
				id: id,
				remove: function(){
					delete obj[monitors][id];
					if (Object.keys(obj[monitors]).length === 0){
						obj[name] = obj[original];
						delete obj[original];
						delete obj[monitors];
					}
				}
			};
		}
	}
	
	let arrowRightKeySequence = [
		{type:"keydown",  key:"ArrowRight", code:"ArrowRight", keyCode:39, charCode:0, which:39},
		{type:"keyup",  key:"ArrowRight", code:"ArrowRight", keyCode:39, charCode:0, which:39}
	],
	arrowLeftKeySequence = [
		{type:"keydown",  key:"ArrowLeft", code:"ArrowLeft", keyCode:37, charCode:0, which:37},
		{type:"keyup",  key:"ArrowLeft", code:"ArrowLeft", keyCode:37, charCode:0, which:37}
	];

	function dispatchKeySequence(target, keySequence)
	{
		keySequence.forEach(k=>{
			let str = k.type + "  key:" + k.key + " code:" + k.code + " keyCode:"+k.keyCode+" charCode:"+k.charCode + " which:"+k.which;
			target.dispatchEvent(new KeyboardEvent(k.type, {key:k.key, code:k.code, keyCode:k.keyCode, charCode:k.charCode, which:k.which}));
		});
	}
	
	let virtualKeyCode = {
		'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79, 'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89, 'z': 90, 'A': 65, 'B': 66, 'C': 67, 'D': 68, 'E': 69, 'F': 70, 'G': 71, 'H': 72, 'I': 73, 'J': 74, 'K': 75, 'L': 76, 'M': 77, 'N': 78, 'O': 79, 'P': 80, 'Q': 81, 'R': 82, 'S': 83, 'T': 84, 'U': 85, 'V': 86, 'W': 87, 'X': 88, 'Y': 89, 'Z': 90, '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57, '!': 49, '"': 50, '#': 51, '$': 52, '%': 53, '&': 54, '\'': 55, '(': 56, ')': 57,'-': 173, '=': 173, '^': 160, '~': 160, '\\': 220, '|': 220, '@': 64, '`': 64, '[': 219, '{': 219, ';': 59, '+': 59, ':': 58, '*': 58, ']': 221, '}': 221, ',': 188, '<': 188, '.': 190, '>': 190, '/': 191, '?': 191, '_': 220, ' ': 32
	};
	
	function dispatchKeystroke(target, keystroke)
	{
		for(let i = 0 ; i < keystroke.length ; i++){
			let key = keystroke.charAt(i), charCode = key.charCodeAt(0), vkeyCode = virtualKeyCode[key];
			if (! vkeyCode){
				console.log("#### dispatchKeystroke not support char code:"+key.charCodeAt(0));
				continue;
			}
			[
				{type:"keydown", key:key, keyCode:vkeyCode, charCode:0,             which:vkeyCode},
				{type:"keypress", key:key, keyCode:charCode, charCode:charCode, which:charCode},
				{type:"keyup",      key:key, keyCode:vkeyCode, charCode:0,             which:vkeyCode}
			].forEach(k=>{
				target.dispatchEvent(new KeyboardEvent(k.type,
											{key:k.key, keyCode:k.keyCode, charCode:k.charCode, which:k.which}));
			});
		}
	}
		
	//===============================================================
	// Debug
	//===============================================================

	function log(s, css)
	{
		if (avotter.debug)
			console.log.apply(console, arguments);
	}
	
	//===============================================================
	//  Languages
	//===============================================================
	var jpMessageTable = {
		"hidePromotion": "プロモーションを非表示",
		"hideRecommendedUser": "おすすめユーザーを非表示",
		"fitImageToArea": "画像全体を枠内に表示",
		"delayForFitImage": "┗枠内表示処理遅延時間（ミリ秒）",
		"addFetchAndMonitorButton": "自動更新新着監視ボタンを表示",
		"fetchAfterStayFor": "┗監視中更新実行までの文書先頭滞在時間（秒）",
		"hideProfileAndPinnedTweetWhenMonitoring": "┗監視中はプロフと固ツイを非表示",
		"monitorXhrInBackground": "┗バックグラウンド時xhrを監視する",
		"showArrivalOfNewTweetsInTab": "監視中新着数/TL新着有無/通知数/DM数をタブに表示する",
		"emojiForNotification": "┗上記表示用絵文字（監視中新着,TL新着,通知,DM）",
		"forceWorkingInBackground": "バックグラウンドで通知等を取得",
		"addHomeButton": "戻るボタンの横にホームボタンを表示",
		"addGoTopButton": "文書先頭に行くボタンを表示",
		"goTopButtonAtMousePosition": "┗上記ボタン＋戻るボタンをマウス位置に表示",
		"closeModalDialogByDoubleClick": "ポップアップをダブルクリックで閉じクリックで画像移動",
		"storeSettingsInBrowser": "上記設定をブラウザに保存する",
		"Apply": "適用",
		"Close": "閉じる",
		"ApplyAndClose": "適用して閉じる",
		"Settings": "設定",
		"invalid value": "無効な値です",
		"Error": "エラー",
		"Alert": "警告",
		"this site is not twitter": "このサイトはツイッターではありません",
		"tweet": "ツイート",
		"NotFound": "が見つかりません",
		"ExitApp": "Avotterを終了します",
		"button": "ボタン",
		"dummy": "dummy"
	};
	
	function translate(s)
	{
		let s2;
		if (window.avotterMessageTable && (s2 = window.avotterMessageTable[s]))
			return s2;
		else if (jpMessageTable && (s2 = jpMessageTable[s]))
			return s2;
		else
			return s;
	}
	
	//===============================================================
	// avtr
	//===============================================================
	function avtrShow(e, fShow)
	{
		(fShow == null ? true : fShow) ? e.classList.remove("avtr-hide") : e.classList.add("avtr-hide");
	}

	function avtrHide(e)
	{
		e.classList.add("avtr-hide");
	}

	//===============================================================
	// Dialog
	//===============================================================

	function alert(html, duration, title)
	{
		if (! d.querySelector("#avtr-alert-css")){
			appendStylesheet('div.avtr-alert{display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);max-width:50%;z-index:10;border:2px outset;border-radius:5px;background-color:gold;padding:5px 10px;align:center;text-align:center;}', "avtr-alert-css"
			);
		}
		if (title == null)
			title = "Alert";
		let e = d.createElement("div");
		e.className = "avtr-alert";
		e.innerHTML = '<div>Avotter '+translate(title)+'</div><hr /><p><span class="avtr-alert-msg"></span></p><button type="button">Close</button>';
		d.body.appendChild(e);
		e.querySelector("button").addEventListener("click", function(){
			let e = event.target.parentElement;
			if (e.avotterTimer)
				clearTimeout(e.avotterTimer);
			e.remove();
			event.stopPropagation();
		});
		e.querySelector(".avtr-alert-msg").innerHTML = html.replace(/\n/g,"<br />");
		e.style.display = "block";
		function fadeout(opacity)
		{
			if (opacity == null)
				opacity = 0.9;
			if (opacity > 0){
				e.style.opacity = opacity;
				e.avotterTimer = setTimeout(fadeout, 100, Math.trunc(opacity*10 - 1) / 10);
			}
			else {
				e.remove();
			}
		}
		if (duration == null)
			duration = 3000;
		e.avotterTimer = setTimeout(fadeout, duration);
	}
	
	//===============================================================
	// Avotter Settings
	//===============================================================
	let defaultFetchAfterStayFor = "10",
		defaultEmojiForNotification = ["👁","🏠","🔔","✉"]
		;
	
	function loadAvotterSettings()
	{
		// remove obsolete option
		window.localStorage.removeItem("avotter.settings.forceToFetchInSearch");
		Object.keys(avotter.settings).forEach(k=>{
			let v = window.localStorage.getItem("avotter.settings."+k), oldVal = avotter.settings[k];
			if (v){
				if (typeof oldVal === "boolean")
					v = v !== "0";
				else if (typeof oldVal === "string")
					/* v = v */;
				avotter.settings[k] = v;
			}
		});
	}
	
	function saveAvotterSettings()
	{
		Object.keys(avotter.settings).forEach(k=>{
			let  v = avotter.settings[k];
			if (typeof v === "boolean")
				v = v ? "1" : "0"
			else if (typeof v === "string")
				/* v = v */;
			window.localStorage.setItem("avotter.settings."+k, v);
		});
	}
	
	function clearAvotterSettings()
	{
		Object.keys(avotter.settings).forEach(k=>{
			window.localStorage.removeItem("avotter.settings."+k);
		});
	}
	
	function onAvotterSettingsClose()
	{
		let menu = d.getElementById("avtr-settings");
		if (menu){
			menu.remove();
			d.body.removeEventListener("click", onAvotterSettingBodyClick);
		}
	}
	
	function isValidSetting(k,v)
	{
		if (k === "fetchAfterStayFor" || k === "delayForFitImage"){
			let n = v * 1;
			if (! v || isNaN(n) || n < 0){
				alert(translate("invalid value")+"\n"+translate(k)+": "+v, 10*1000);
				return false;
			}
		}
		else if (k === "emojiForNotification"){
			let a = v.split(",");
		}
		return true;
	}
	
	function onAvotterSettingsApplyAndClose()
	{
		let menu = d.getElementById("avtr-settings"), 
			items = menu.querySelectorAll(".avtr-settings-item"),
			prev = {},
			needToScan = false,
			delayForFitImageChanged;
		for (let i = 0 ; i < items.length ; i++){
			let e = items[i], k = e.getAttribute("avtr-option-name"), oldVal = prev[k] = avotter.settings[k], v;
			if (typeof oldVal === "boolean"){
				v = e.checked;
				if (oldVal !== v){
					if (/^(hidePromo|hideRecom|fitImage)/.test(k))
						needToScan = true;
				}
			}
			else if (typeof oldVal === "string"){
				v = e.value;
				if (! isValidSetting(k, v))
					return;
				if (oldVal !== v){
					if (k === "delayForFitImage")
						delayForFitImageChanged = true;
				}
			}
			avotter.settings[k] = v;
		}
		if (avotter.settings.storeSettingsInBrowser)
			saveAvotterSettings();
		else
			clearAvotterSettings();
		if (delayForFitImageChanged)
			delayForFitImage = avotter.settings.delayForFitImage * 1;
		let page = currentPage();
		if (! page.modal && page.type === "tweet"){
			if (needToScan)
				setTimeout(scanTweets, 0);
			if (avotter.settings.addFetchAndMonitorButton){
				if (! prev.addFetchAndMonitorButton)
					addFetchAndMonitorButtonToPage();
			}
			else if (prev.addFetchAndMonitorButton){
				fetchAndMonitorNewTweet(false);
				removeFetchAndMonitorButtonFromPage();
			}
		}
		initEmojiForNotification();
		setTimeout(avotter.settings.showArrivalOfNewTweetsInTab ? notifyInTab : clearNotifyInTab, 0);
		if (isMobile()){
			if (avotter.settings.addHomeButton){
				if (! prev.addHomeButton)
					addHomeButtonToPage();
			}
			else if (! prev.addHomeButton){
				removeHomeButtonFromPage();
			}
		}
		if (avotter.settings.addGoTopButton !== prev.addGoTopButton){
			if (avotter.settings.addGoTopButton){
				window.addEventListener("scroll", onScrollForGoTopButton);
				if (! isMobile() && avotter.settings.goTopButtonAtMousePosition)
					d.addEventListener("mousemove", onMouseMoveForGoTopButton);
			}
			else {
				window.removeEventListener("scroll", onScrollForGoTopButton);
				if (! isMobile())
					d.removeEventListener("mousemove", onMouseMoveForGoTopButton);
			}
			showGoTopBackButton();
		}
		if (! isMobile()){
			if (avotter.settings.goTopButtonAtMousePosition !== prev.goTopButtonAtMousePosition){
				if (avotter.settings.goTopButtonAtMousePosition){
					if (avotter.settings.addGoTopButton)
						d.addEventListener("mousemove", onMouseMoveForGoTopButton);
				}
				else {
					d.removeEventListener("mousemove", onMouseMoveForGoTopButton);
				}
				showGoTopBackButton();
			}
		}
		
		onAvotterSettingsClose();
	}

	function onAvotterSettingBodyClick()
	{
		let menu = d.getElementById("avtr-settings");
		if (menu){
			if (! isAscendant(menu, event.target)){
				onAvotterSettingsClose();
			}
		}
	}

	function showAvotterSettingsDialog()
	{
		'use strict';
		if (! d.querySelector("#avtr-settings-css")){
			appendStylesheet('div.avtr-settings{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);max-width:80%;z-index:3;border:2px outset;border-radius:5px;background-color:linen;padding:5px;align:center;}.avtr-settings.avtr-mobile{width:80%}.avtr-settings button{margin:auto 5px}', "avtr-settings-css"
			);
		}
		let e = d.createElement("div");
		e.innerHTML = '<div id="avtr-settings" class="avtr-settings"><span class="avtr-settings-title">'
		+ 'Avotter ' + AVOTTER_VERSION_STRING
		+ ' ' + translate("Settings")+'</span><hr/><div class="avtr-settings-items"></div><div style="text-align:center"><button type="button" class="avtr-apply-and-close"></button><button type="button" class="avtr-close"></button></div></div>';
		var menu = e.firstElementChild, items = "";
		if (window.chrome && ! isMobile())
			menu.style.font = "message-box";
		if (isMobile())
			menu.classList.add("avtr-mobile");
		Object.keys(avotter.settings).forEach(function(k){
			let v = avotter.settings[k];
			if (! window.chrome){
				if (k === "monitorXhrInBackground")
					return;
			}
			if (isMobile()){
				if (k === "closeModalDialogByDoubleClick")
					return;
				if (k === "goTopButtonAtMousePosition")
					return;
			}
			else {
				if (k === "addHomeButton")
					return;
			}
			if (typeof v === "boolean"){
				items += '<div><label><input type="checkbox" class="avtr-settings-item" avtr-option-name="'+k+'"'+(v?" checked":"")+'>'+translate(k)+'</label></div>';
			}
			else if (typeof v === "string"){
				items += '<div><label>'+translate(k)+'<input type="text" class="avtr-settings-item" size="'+(v.length+1)+'" avtr-option-name="'+k+'" value="'+v+'"></label></div>';
			}
		});
		menu.querySelector(".avtr-settings-items").innerHTML = items;
		[{class:"avtr-apply-and-close", name:"ApplyAndClose", callback: onAvotterSettingsApplyAndClose},
		{class:"avtr-close", name:"Close", callback: onAvotterSettingsClose}
		 ].forEach(function(o){
			let btn = menu.querySelector("."+o.class);
			btn.innerText = translate(o.name);
			btn.addEventListener("click", o.callback);
		});
		d.body.appendChild(menu);
		d.body.addEventListener("click", onAvotterSettingBodyClick);
	}

	//===============================================================
	//  Avotter UI
	//===============================================================
	function onAvotterButtonClick()
	{
		let menu = d.getElementById("avtr-settings");
		if (! menu){
			showAvotterSettingsDialog();
			event.stopPropagation();
		}
	}

	function isMobile()
	{
		return /^mobile\./.test(location.hostname);
	}
	
	function addAvotterButtonToPage()
	{
		let e = d.querySelector('.avtr-main-button');
		if (! e){
			e = d.querySelector('path[d^="M22.58 7.35L12.475 1.897c-.297-.16-.654-.16-.95 0L1.425 7.35c-."]');
			if (! e)
				e = d.querySelector('path[d^="M22.46 7.57L12.357 2.115c-.223-.12-.49-.12-.713 0L1.543 7.57c-."]');
			if (e){
				while (e = e.parentElement){
					if (e.tagName === "NAV")
						break;
				}
			}
			let parent = e;
			if (parent){
				e = d.createElement("div");
				e.className = "avtr-main-button", e.innerHTML = '<svg viewBox="0 0 48 48" class="avtr-svg-av"><g><path d="M17.873171210289,5.307317063212395l-15.141463428735733,37.61951223015785l7.88292683660984,-0.07804878056049347l3.980487808585167,-10.536585375666618l11.9414634257555,0l-1.4048780500888824,-5.0731707364320755l-8.741463422775269,0.3121951222419739l5.541463419795036,-13.03414635360241l8.11707317829132,27.629268318414688l7.88292683660984,-0.07804878056049347l8.273170739412308,-22.165853679180145l-6.556097567081451,0.07804878056049347l-5.0731707364320755,13.26829269528389l-8.429268300533295,-28.253658562898636l-8.11707317829132,-0.15609756112098694l-0.15609756112098694,0.4682926833629608"/></g></svg><span class="avtr-sup avtr-hide">25</span>';
				if (isMobile())
					e.classList.add('avtr-mobile');
				parent.appendChild(e).addEventListener("click", onAvotterButtonClick);
			}
		}
		return e;
	}

	function getAvotterButton()
	{
		return addAvotterButtonToPage();
	}
	
	function avotterButtonAddClass(name)
	{
		let b = getAvotterButton();
		if (b)
			b.classList.add.apply(b.classList, arguments);
	}

	function avotterButtonRemoveClass(name)
	{
		let b = getAvotterButton();
		if (b)
			b.classList.remove.apply(b.classList, arguments);
	}

	function notifyInButton(count)
	{
		let e, b = getAvotterButton();
		if (b && (e = b.querySelector('span'))){
			if (count > 0){
				e.innerText = count;
				avtrShow(e);
			}
			else {
				avtrHide(e);
				e.innerText = "";
			}
		}
	}
	
	//===============================================================
	// 
	//===============================================================
	function installMutationObserver(e, callback, options)
	{
		e.avotterObserver = new MutationObserver(callback);
		e.avotterObserver.observe(e, options);
	}

	function mutationsChildListForEach(mutations, callback, opt)
	{
		if (opt == null)
			opt = {};
		for (let i = 0 ; i < mutations.length ; i++){
			let m = mutations[i];
			if (m.type !== "childList")
				continue;
			if (opt.addedNodes == null || opt.addedNodes){
				for (let j = 0 ; j < m.addedNodes.length ; j++)
					callback(m.addedNodes[j],"added");
			}
			if (opt.removedNodes == null || opt.removedNodes){
				for (let j = 0 ; j < m.removedNodes.length ; j++)
					callback(m.removedNodes[j],"removed");
			}
		}
	}
	
	function printMutationsIfDebug(mutations, opt)
	{
		if (avotter.debug){
			if (opt == null)
				opt = {};
			for (let i = 0 ; i < mutations.length ; i++){
				let m = mutations[i];
				if (m.type === "childList"){
					if (opt.addedNodes == null || opt.addedNodes){
						for (let j = 0 ; j < m.addedNodes.length ; j++){
							if (opt.filter == null || opt.filter(m.addedNodes[j],"added"))
								log(" m["+i+"]: "+m.type+" add    "+(opt.parent ? e2str(m.addedNodes[j].parentElement)+" > ":"")+e2str(m.addedNodes[j]));
							m.addedNodes[j].classList.add("avtr-mutation-add");
						}
					}
					if (opt.removedNodes == null || opt.removedNodes){
						for (let j = 0 ; j < m.removedNodes.length ; j++){
							if (opt.filter == null || opt.filter(m.removedNodes[j],"removed"))
								log(" m["+i+"]: "+m.type+" remove "+e2str(m.removedNodes[j]));
						}
					}
				}
				else {
					log(" m["+i+"]: "+m.type);
				}
			}
		}
	}

	//===============================================================
	//  tweet and twitter system helper koko
	//===============================================================
	
	let modalSelector = 'div[aria-labelledby="modal-header"]', tweetSelector = 'div[data-testid="tweet"]', trendSelector = 'div[data-testid="trend"]';
	
	function t2str(e, len)
	{
		if (e == null)
			return "null";
		return e.innerText.replace(/\s+/g," ").substring(0, len != null ? len : undefined);
	}
	
	function showTweet(e, fShow)
	{
		(fShow == null ? true : fShow) ? e.classList.remove("avtr-hide") : e.classList.add("avtr-hide");
	}

	function hideTweet(e)
	{
		e.classList.add("avtr-hide");
	}
	
	function isTweetHidden(e)
	{
		return isHidden(e);
	}
	
	function isTweetVisible(e)
	{
		return isVisible(e);
	}
	
	function isTweet(e)
	{
		return e != null && e.querySelector && e.querySelector(tweetSelector);
	}
	
	function hasPreviousVisibleTweet(e)
	{
		while (e = e.previousElementSibling){
			if (isTweet(e) && isTweetVisible(e))
				return true;
		}
		return false;
	}

	function getModal()
	{
		return d.querySelector(modalSelector);
	}
	
	function loadingContents(e)
	{
		if (! e)
			e = d;
		return !! e.querySelector('div[aria-label][role="progressbar"] svg > circle');
	}
	
	function getPrimaryColumn()
	{
		return d.querySelector('div[data-testid="primaryColumn"]');
	}
	
	function getSidebarColumn()
	{
		return d.querySelector('div[data-testid="sidebarColumn"]'); 
	}
	
	function getTweetsContainer()
	{
		let pc = getPrimaryColumn();
		return pc ? pc.querySelector('h1[aria-level="1"] + div > div:first-child > div:first-child') : null;
	}
	
	function getProfileArea()
	{
		let e = d.querySelector('a[href$="/photo"]');
		return  (e && (e = e.parentElement) && (e = e.parentElement) && (e = e.parentElement)) ? e : null;
	}
	
	function isPinnedTweet(e)
	{
		return e != null && e.querySelector('path[d^="M20.235 14.61c-.375-1.745-2.342-3.506-4.01-4.125l-."]');
	}
	
	function isSeparator(e)
	{
		return e != null && e.innerText.trim().length === 0;
	}
	
	function getPinnedTweet()
	{
		let e = getTweetsContainer();
		return (e && (e = e.firstElementChild) && isPinnedTweet(e)) ? e : null;
	}
	
	function tweetsForEach(callback)
	{
		let tweetsContainer = getTweetsContainer();
		if (tweetsContainer){
			for (let i = 0 ; i < tweetsContainer.children.length ; i++){
				if (callback(tweetsContainer.children[i]))
					break;
			}
		}
	}
		
	function printTweets()
	{
		tweetsForEach(e=>console.log((isTweetHidden(e) ? "[hidden]" : e.classList.contains("avtr-already-read")?"[Read]":"[Unread]")+" "+t2str(e,50)))
	}

	function printTweetsIfDebug()
	{
		if (avotter.debug)
			printTweets();
	}

	function tweetIdOf(e)
	{
		let a = e.querySelector('a[title][href*="/status/"]');
		return a ? a.href.substring(a.href.lastIndexOf("/")+1) : "";
	}
	
	function getPageType()
	{
		let type = null;
		if (! getModal()){
			if (containsElement(getPrimaryColumn(), tweetSelector))
				type = "tweet";
			else if (isTrendPage(location.pathname) && containsElement(getPrimaryColumn(), trendSelector))
				type = "trend";
		}
		return type
	}
	
	//===============================================================
	//  parse tweet
	//===============================================================
	let parseTweet;
	(function(){
		function plainText(e)
		{
			return e ? e.innerText.replace(/\s+/g," ") : "";
		}

		function fullText(textContainer)
		{
			'use strict';
			let text = "";
			for (let i = 0 ; i < textContainer.childNodes.length ; i++){
				let e, emoji, n = textContainer.childNodes[i];
				if (n.nodeType === Node.TEXT_NODE){
					text += n.data;
				}
				else if (n.nodeType === Node.ELEMENT_NODE){
					if (n.getAttribute("aria-hidden") !== "true"){
						if ((e = n.querySelector('div[aria-label]')) && (emoji = e.getAttribute("aria-label")))
							text += emoji;
						else if (n.tagName === "A" && n.querySelector('span[aria-hidden="true"]'))
							text += fullText(n);
						else
							text += n.innerText;
					}
				}
			}
			return text;
		}

		parseTweet = function(tw)
		{
			'use strict';
			let o = {}, s, e, r, tweet, 	rightColumn, target, header, body, mention, text, media, quoted, footer, tail, time, href,  a;
			if (tweet = tw.querySelector('div[data-testid="tweet"]')){
				rightColumn = tweet.firstElementChild.nextElementSibling;
				header = rightColumn.firstElementChild;
				{
					(a = header.querySelector('a')) && (e = a.querySelector('span')) && (o.userName = fullText(e));
					a && (href = a.getAttribute("href")) && (o.screenName = href.substring(1));
					(time = header.querySelector('a > time')) && (href = time.parentElement.getAttribute("href")) && (r = href.match(/\/(\w+)\/status\/(\d+)$/)) && (o.screenName = r[1], o.tweetId = r[2]);
					time && (o.time = plainText(time)) && (s = time.getAttribute("datetime")) && (o.datetime = s);
				}
				body = header.nextElementSibling;
				if (text = body.querySelector('div[lang]')){
					target = body.firstElementChild;
					// mention
					(mention = target) && (mention !== text.parentElement) && (o.mention = plainText(mention));
					// tweet body
					o.tweet = fullText(text);
					target = text.parentElement.nextElementSibling;
					// quoted or media
					if ((quoted = target) && (quoted.getAttribute("role") !== "group")){
						o.quoted  = plainText(quoted);
						if (quoted.querySelector('div[data-testid="playButton"]')){
							o.containsVideo = true;
							if (r = o.quoted.match(/(\d[\d\.,]*万?)回表示/)){
								o.playCount = r[1];
							}
						}
						target = quoted.nextElementSibling;
					}
					// reply, retweet, link
					if ((footer = target) && (footer.getAttribute("role") === "group")){
						["reply", "retweet", "like"].forEach(id=>{
							(e = footer.querySelector('div[data-testid="'+id+'"]')) && (o[id+"Count"] = e.innerText);
						});
						target = footer.nextElementSibling;
					}
					// tail
					(tail = target) && (o.tail = plainText(tail));
				}
			}
			return o;
		}
	})();
	
	//===============================================================
	//  moniter tweets
	//===============================================================
	let monitorTweet, scanTweets, defaultDelayForFitImage = isMobile() ? "300" : "150", delayForFitImage = defaultDelayForFitImage * 1;
	
	(function(){//fetchAfterStayFor = defaultFetchAfterStayFor * 1000
		let fitImageClassName = "avtr-fit-image";
		
		function fitImageToArea(tw, restore)
		{
			if (restore){
				let ee = tw.getElementsByClassName(fitImageClassName);
				for (let i = 0 ; i < ee.length ; i++){
					let e = ee[i];
					e.classList.remove(fitImageClassName);
					e.firstElementChild.style.backgroundSize = "";
					if (typeof e.avtrFitImageStyle === "string")
						e.setAttribute("style", e.avtrFitImageStyle);
					delete e.avtrFitImageStyle;
				}
			}
			else {
				let ee = tw.querySelectorAll('div > div[style*="background-image"] + img[src*="twimg.com/"]');
				for (let i = 0 ; i < ee.length ; i++){
					if (/\/(media|ext_tw_video_thumb)\//.test(ee[i].src)){
						let e = ee[i].parentElement, style = e.getAttribute("style");
						if (style && style.includes("margin")){
							if (! e.classList.contains(fitImageClassName)){
								e.classList.add(fitImageClassName);
								e.avtrFitImageStyle = style;
								e.removeAttribute("style");
								e.firstElementChild.style.backgroundSize = "contain";
							}
						}
					}
				}
			}
		}
		
		function isHeading(e)
		{
			return e.querySelector('h2[aria-level="2"][role="heading"]') != null;
		}

		function isUserCell(e)
		{
			return e.querySelector('div[data-testid="UserCell"]') != null;
		}

		function doesNeedToHide(e, prev, next)
		{
			if (e.querySelector('path[d^="M20.75 2H3.25C2.007"]')){
				if (avotter.settings.hidePromotion){
					return {promotion: true};
				}
			}
			if (avotter.settings.hideRecommendedUser){
				if (! (/^\/(search$|hashtag\/)/.test(location.pathname) && ! /&f=(live|image|video)/.test(location.search))){
					let ru = {recommendedUser: true};
					if (isUserCell(e)){
						return ru;
						//if (prev && isHeading(prev))
						//	return true;
					}
					else if (e.querySelector('a[href^="/i/related_users/"]'))
						return ru;
					else if (e.querySelector('a[href="/who_to_follow"]'))
						return ru;
					else if (isHeading(e) && next && isUserCell(next))
						return ru;
				}
			}
			return null;
		}

		function hideIfNeed(e, prev, next)
		{
			let r = doesNeedToHide(e, prev, next);
			if (r){
				log("hide: " + t2str(e, 50));
				hideTweet(e);
				notifyInButton(++avotter.hiddenItemCount);
			}
		}
		
		function hideOrShow(e, prev, next)
		{
			let r = doesNeedToHide(e, prev, next);
			if (r){
				log("hide: " + t2str(e, 50));
				hideTweet(e);
				notifyInButton(++avotter.hiddenItemCount);
			}
			else
				showTweet(e);
		}
		
		function indexof(e)
		{
			if (e == null)
				return -1;
			let i = 0;
			while (e.previousElementSibling){
				e = e.previousElementSibling;
				i++;
			}
			return i;
		}
		
		function summarizeUserData(user)
		{
			return {
				description: user.description,
				location: user.location,
				followersCount: user.followers_count,
				friendsCount: user.friends_count,
				createdAt: user.created_at
			};
		}
		
		function dispatchTweetToAddon(e, state)
		{
			if (avotter.addonNeedsTweet){
				if (! e.querySelector('article') || e.classList.contains("avtr-hide"))
					return;
				let data = parseTweet(e), user = getUserProfile(data.screenName);
				Object.keys(avotter.addon).forEach(k=>{
					let addon = avotter.addon[k];
					if (typeof addon.hideThisTweet === "function"){
						if (addon.option && addon.option.userProfile)
							user && (data.user = addon.option.rawProfile ? user : summarizeUserData(user));
						else
							delete data.user;
						if (addon.hideThisTweet(data, state)){
							hideTweet(e);
							notifyInButton(++avotter.hiddenItemCount);
						}
					}
				});
			}
		}
		
		function onInsertBefore(e, e2)
		{
			if (this.avotterMoniteringTweet){
				if (avotter.verbose)
					console.log("insert " + t2str(e,40) + " before ["+indexof(e2)+"] "+t2str(e2,40));
				if (avotter.settings.hidePromotion || avotter.settings.hideRecommendedUser){
					let prev = e2.previousElementSibling;
					if (prev && isHeading(prev))
						hideIfNeed(prev, prev.previousElementSibling, e);
					hideIfNeed(e, prev, e2);
				}
				if (avotter.settings.fitImageToArea)
					setTimeout(fitImageToArea, delayForFitImage, e);
				dispatchTweetToAddon(e, {/*for future extension*/});
				//setTimeout(dispatchTweetToAddon, 0, e, {/*for future extension*/});
			}
		}
		
		function onAppendChild(e)
		{
			if (this.avotterMoniteringTweet){
				if (avotter.verbose){
					console.log("append " + t2str(e,40) + " after ["+indexof(this.lastElementChild)+"] "+t2str(this.lastElementChild,40));
				}
				if (avotter.settings.hidePromotion || avotter.settings.hideRecommendedUser){
					let prev = this.lastElementChild;
					if (prev && isHeading(prev))
						hideIfNeed(prev, prev.previousElementSibling, e);
					hideIfNeed(e, prev, null);
				}
				if (avotter.settings.fitImageToArea)
					setTimeout(fitImageToArea, delayForFitImage, e);
				dispatchTweetToAddon(e, {/*for future extension*/});
				//setTimeout(dispatchTweetToAddon, 0, e, {/*for future extension*/});
			}
		}
		
		function onRemoveChild(e)
		{
			if (this.avotterMoniteringTweet){
				if (avotter.verbose)
					console.log("remove [" + indexof(e) + "] " + t2str(e,40));
			}
		}
		
		scanTweets = function(tweetsContainer)
		{
			if (! tweetsContainer)
				tweetsContainer = getTweetsContainer();
			if (tweetsContainer){
				for (let i = tweetsContainer.children.length - 1 ; i >= 0 ; i--){
					let e = tweetsContainer.children[i];
					hideOrShow(e, e.previousElementSibling, e.nextElementSibling);
					fitImageToArea(e, ! avotter.settings.fitImageToArea);
					dispatchTweetToAddon(e, {/*for future extension*/});
				}
			}
		}
		
		monitorTweet = function(enable){
			let tweetsContainer = getTweetsContainer();
			if (tweetsContainer){
				if (enable){
					delayForFitImage = avotter.settings.delayForFitImage * 1;
					if (! tweetsContainer.avotterMoniteringTweet){
						log("# monitorTweet started");
						if (! tweetsContainer.avotterHookedTweet){
							addObjectMethodMonitor(tweetsContainer, "insertBefore", onInsertBefore);
							addObjectMethodMonitor(tweetsContainer, "appendChild", onAppendChild);
							addObjectMethodMonitor(tweetsContainer, "removeChild", onRemoveChild);
							tweetsContainer.avotterHookedTweet = true;
						}
						scanTweets(tweetsContainer);
						tweetsContainer.avotterMoniteringTweet = true;
					}
				}
				else {
					if (tweetsContainer.avotterMoniteringTweet){
						tweetsContainer.avotterMoniteringTweet = false;
						log("# monitorTweet stopped");
					}
				}
			}
			else {
				if (currentPage().type === "tweet")
					log("#### monitorTweet() error: getTweetsContainer() failed");
			}
		};
	})();
	
	//===============================================================
	// modal dialog
	//===============================================================
	function getButtonFromPathD(elem, path_d)
	{
		let e = elem.querySelector('div[role="button"] > div > svg > g > path[d^="'+path_d+'"]');
		return e ? e.parentElement.parentElement.parentElement.parentElement : null;
	}
	
	function getCloseButton(e)
	{
		e && (e = getButtonFromPathD(e, "M13.414 12l5.793-5.793c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414"));
		return e;
	}
	
	function getBackwordButton(e)
	{
		e && (e = getButtonFromPathD(e, "M20 11H7.414l4.293-4.293c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414"));
		return e;
	}
	
	function getForwordButton(e)
	{
		e && (e = getButtonFromPathD(e, "M19.707 11.293l-6-6c-.39-.39-1.023-.39-1.414 0s-.39 1.023 0 1.414L16.586"));
		return e;
	}
	
	function getButtonFromChild(m, e)
	{
		if (m){
			let b, ee = m.querySelectorAll('div[role="button"]');
			for (let i = 0 ; i < ee.length ; i++){
				if ((b = ee[i]) === e || isAscendant(b, e))
					return b;
			}
		}
		return null;
	}
	
	function installModalDialogHandler()
	{
		let m = getModal();
		if (m && ! m.avotterHandlingModal){
			m.avotterHandlingModal = true;
			log("# installing dblclick handler to modal");
			let pending = null, closing;
			m.addEventListener("dblclick", function(){
				log(event.target.tagName+".onDblclick");
				if (pending){
					clearTimeout(pending);
					pending = null;
				}
				let b = getCloseButton(m);
				b && (closing = true) && b.click();
			});
			if (getForwordButton(m)){
				log("# installing click handler to modal");
				let r = m.getBoundingClientRect(), threshold = r.left + (r.right - r.left) / 2;
				m.addEventListener("click", function(){
					log(event.target.tagName+".onClick");
					if (closing){
						log("closing");
						closing = false;
						return;
					}
					let b;
					if (b = getButtonFromChild(m, event.target)){
						log("button "+b.getAttribute("aria-label"));
						return; //  just clicked the some button.
					}
					if (event.target.tagName === "IMG"){
						let e = event.target.parentElement.parentElement.nextElementSibling;
						if (e && e.getAttribute("data-testid") === "playButton"){
							log("found playButton");
							return;
						}
					}
					if (! pending){
						pending = setTimeout(function(event){
							log("delayed " + event.target.tagName+".onClick");
							pending = null;
							//let k = event.clientX > threshold ? arrowRightKeySequence : arrowLeftKeySequence;
							let e = event.clientX > threshold ? getForwordButton(m) : getBackwordButton(m);
							e && e.click(); //dispatchKeySequence(d, k);
						}, 300, event);
					}
				});
			}
		}
	}
	
	//===============================================================
	// moniter search results page
	//===============================================================
	let fetchAndMonitorNewTweet, getNewSearchResultCount;
	
	(function(){
		const MARK_AFTER_DURATION = 4*1000;
		let monitoring, watchdogTimer, fetchAfterStayFor = defaultFetchAfterStayFor * 1000, 
			scrollEvent, lastReadTweet, tweetsContainer, 
			newTweetDetected, newTweetFetched, handleXhrOpen, alreadyRead = {}, intersectionObserver;
		
		function installTweetsMutationObserver()
		{
			if (! tweetsContainer.avotterObserver){
				installMutationObserver(tweetsContainer, tweetsMutationObserver, {childList:true});
				log("# tweetsMutationObserver ready");
			}
		}
		
		function removeTweetsMutationObserver()
		{
			if (tweetsContainer.avotterObserver){
				tweetsContainer.avotterObserver.disconnect();
				delete tweetsContainer.avotterObserver;
				log("tweetsMutationObserver removed");
			}
		}
		
		function scrollByEx(dx,dy){
			scrollBy(dx, dy);
			if (d.hidden){
				log("dispatch scroll event in background");
				window.dispatchEvent(scrollEvent);
			}
		}

		function watchdog()
		{
			if (watchdogStartAt){
				let now = Date.now();
				let elapsed = now - watchdogStartAt;
				let e = d.querySelector(".avtr-eye-button .avtr-eye-countdown");
				if (e)
					e.innerText = Math.ceil((fetchAfterStayFor - elapsed) / 1000);
				if (elapsed >= fetchAfterStayFor){
					if (d.hidden && avotter.settings.monitorXhrInBackground && window.chrome){
						if (! handleXhrOpen){
							handleXhrOpen = addObjectMethodMonitor(XMLHttpRequest.prototype, "open", onXhrOpen);
							if (handleXhrOpen)
								log("# start monitoring XMLHttpRequest.open");
						}
					}
					else if (handleXhrOpen){
						handleXhrOpen.remove();
						handleXhrOpen = null;
					}
					let byProgrammaticScrollSequence;
					if (! byProgrammaticScrollSequence){
						log("dispatch keyborad '.' event");
						dispatchKeystroke(document, ".");
						watchdogStartAt = now;
					}
					else {
						let dy = Math.floor(window.innerHeight / 2);
						log("# enter programmatic scroll sequence");
						window.removeEventListener("scroll", onScroll)
						watchdogStartAt = now;
						scrollByEx(0, dy);
						setTimeout(function(){
							scrollByEx(0, -dy);
							setTimeout(function(){
								window.addEventListener("scroll", onScroll)
								log("# exit programmatic scroll sequence");
							}, 500);
						}, 100);
					}
				}
			}
		}
		
		function startWatchdog()
		{
			log("# watchdog starting");
			watchdogStartAt = Date.now();
			watchdogTimer = setInterval(watchdog, 1*1000);
			newTweetDetected = newTweetFetched = false;
			notifyInTab();
			let e = d.querySelector(".avtr-eye-button .avtr-eye-countdown");
			if (e){
				e.innerText = Math.ceil(fetchAfterStayFor / 1000);
				e.classList.remove("avtr-hide");
			}
		}
		
		function stopWatchdog()
		{
			log("# watchdog stopping");
			watchdogStartAt = 0;
			if (watchdogTimer){
				clearInterval(watchdogTimer);
				watchdogTimer = null;
			}
			if (handleXhrOpen){
				handleXhrOpen.remove();
				handleXhrOpen = null;
			}
			let e = d.querySelector(".avtr-eye-button .avtr-eye-countdown");
			if (e)
				e.classList.add("avtr-hide");
		}
		
		function markAlreadyReadOrObserveIntersection(e)
		{
			let id = tweetIdOf(e);
			if (id){
				if (isTweetHidden(e)){
					alreadyRead[id] = true;
					e.classList.add("avtr-already-read");
				}
				else {
					if (alreadyRead[id]){
						e.classList.add("avtr-already-read");
						log("# ^already read. add 'avtr-already-read'");
					}
					else {
						if (! d.hidden){
							intersectionObserver.observe(e);
							log("# ^start observing intersection");
						}
						else {
							log("# ^unread but not observe intersection because in backgrond");
						}
					}
				}
			}
		}
		
		function tweetsMutationObserver(mutations, observer)
		{
			log("# tweetsMutationObserver");
			mutationsChildListForEach(mutations, function(e, type){
				log(type+": "+t2str(e, 50));
				if (type === "added" && e.classList != null)
					markAlreadyReadOrObserveIntersection(e);
			});
			if (! newTweetDetected){
				if (lastReadTweet){
					if (! lastReadTweet.parentElement || hasPreviousVisibleTweet(lastReadTweet)){
						newTweetDetected = true;
						newTweetFetched = false;
						log("#### new tweet detected");
						lastReadTweet = null;
						stopWatchdog();
					}
				}
			}
			notifyInTab();
		}
		
		function isTarget(url)
		{
			return /\/(search\/adaptive|timeline\/(home|list|profile\/\d+))\.json/.test(url);
		}
		
		function onXhrOpen(method, url)
		{
			if (method.toUpperCase() === "GET" && isTarget(url)){
				this.addEventListener("load", function(){
					try {
						let j = JSON.parse(this.responseText);
						if (j.globalObjects && j.globalObjects.tweets && j.globalObjects.users){
							let keys = Object.keys(j.globalObjects.tweets);
							if (keys.length){
								keys.forEach(k=>{
									let tweet = j.globalObjects.tweets[k], user = j.globalObjects.users[tweet.user_id_str];
									log("fetched: "+(user.name+" @"+user.screen_name+" "+tweet.full_text.replace(/\s+/g," ")).substring(0,60));
								});
								if (! newTweetFetched){
									log("#### new tweets fetched");
									newTweetFetched = true;
									stopWatchdog();
									notifyInTab();
								}
							}
						}
					}
					catch(e){}
				});
				log("# listening event 'load' on "+ url.substring(0,50));
			}
		}
		
		function markAlreadyReadAfter(e)
		{
			e.avotterAlreadyTimer = setTimeout(function(e){
					e.classList.add("avtr-already-read");
					delete e.avotterAlreadyTimer;
				}, MARK_AFTER_DURATION, e);
		}
		
		function onIntersectionChanged(entries, observer)
		{
			let marked = 0, markAfter = 0;
			entries.forEach(e=>{
				if (! e.target.classList.contains("avtr-already-read")){
					//log(e.intersectionRatio.toString().substring(0,5)+" "+t2str(e.target, 50));
					if (e.target.avotterAlreadyRead){
						if (e.intersectionRatio === 0){
							//log("^ added class 'avtr-already-read'");
							e.target.classList.add("avtr-already-read");
							marked++;
							if (e.target.avotterAlreadyTimer){
								clearTimeout(e.target.avotterAlreadyTimer);
								delete e.target.avotterAlreadyTimer;
							}
						}
						else if (e.intersectionRatio === 1){
							/*
							if (! e.target.avotterAlreadyTimer){
								markAlreadyReadAfter(e.target);
								markAfter++;
							}
							*/
						}
					}
					else if (e.intersectionRatio > 0){
						e.target.avotterAlreadyRead = true;
						let id = tweetIdOf(e.target);
						if (id){
							alreadyRead[id] = true;
							//log("^ added to alreadyRead");
							/*
							if (e.intersectionRatio === 1){
								markAlreadyReadAfter(e.target);
								markAfter++;
							}
							*/
						}
						else {
							log("#### can't retrieve tweet id: "+t2str(e.target, 50));
						}
					}
				}
			});
			if (marked > 0)
				notifyInTab()
			if (markAfter > 0)
				setTimeout(notifyInTab, MARK_AFTER_DURATION + 500);
		}
		
		function onVisibilityChange()
		{
			if (d.hidden){
				log("## document visibilty changed. intersectionObserver stop observing all tweets");
				intersectionObserver.disconnect();
			}
			else {
				log("## document visibilty changed. intersectionObserver start observing below");
				tweetsForEach(e=>{
					if (isTweet(e) && isTweetVisible(e) && ! e.classList.contains("avtr-already-read")){
						log("    "+t2str(e,50));
						intersectionObserver.observe(e);
					}
				});
			}
		}
		
		function onScroll()
		{
			if (d.hidden){
				log("## ignore scroll event in background. pageYOffset:"+window.pageYOffset);
				return;
			}
			if (window.pageYOffset === 0){
				if (! watchdogStartAt){
					startWatchdog();
					if (event){ // do nothing when directly called from startMonitering()
						for (let i = 0 ; i < tweetsContainer.children.length ; i++){
							let e = tweetsContainer.children[i];
							e.classList.add("avtr-already-read");
							/*
							// hidden tweets never removed. so display them and force twitter to remove them
							if (isTweetHidden(e) && i > 30)
								showTweet(e);
							*/
						}
						let firstTweet = tweetsContainer.firstElementChild;
						if (isPinnedTweet(firstTweet)){
							firstTweet = firstTweet.nextElementSibling;
							if (isSeparator(firstTweet))
								firstTweet = firstTweet.nextElementSibling;
						}
						if (firstTweet !== lastReadTweet){
							if (lastReadTweet = firstTweet){
								log("lastReadTweet: " + t2str(lastReadTweet,50));
							}
						}
						printTweetsIfDebug();
						notifyInTab()
					}
				}
			}
			else {
				if (watchdogStartAt){
					log("onscroll pageYOffset="+window.pageYOffset + "  watchdog will stop");
					watchdogStartAt = 0;
					stopWatchdog();
				}
			}
		}
		
		function stopMonitering()
		{
			if (! monitoring)
				return;
			removeTweetsMutationObserver();
			d.removeEventListener("visibilitychange", onVisibilityChange);
			window.removeEventListener("scroll", onScroll);
			if (handleXhrOpen){
				handleXhrOpen.remove();
				handleXhrOpen = null;
			}
			if (watchdogTimer){
				clearInterval(watchdogTimer);
				watchdogTimer = null;
			}
			let e = d.querySelector(".avtr-eye-button");
			if (e){
				e.classList.remove("avtr-eye-monitoring");
				e.querySelector(".avtr-eye-countdown").classList.add("avtr-hide");
				e.querySelector(".avtr-eye-new-arrivals").classList.add("avtr-hide");
			}
			if ((e = getProfileArea()) && isHidden(e)){
				avtrShow(e);
				if (e = getPinnedTweet()){
					showTweet(e);
					if (isSeparator(e.nextElementSibling))
						showTweet(e.nextElementSibling);
				}
			}
			lastReadTweet = tweetsContainer = null;
			currentPage().monitoring = monitoring = false;
			log("# fetchAndMonitorNewTweet stopped");
		}
		
		function startMonitering()
		{
			if (monitoring)
				return;
			log("# fetchAndMonitorNewTweet starting");
			tweetsContainer = getTweetsContainer();
			if (! tweetsContainer){
				alert(translate("tweet") + " " + translate("NotFound"), null, "Error");
				log("#### tweetsContainer not found");
				return;
			}
			if (! scrollEvent){
				scrollEvent = d.createEvent("HTMLEvents");
				scrollEvent.initEvent("scroll", true, true);
			}
			if (! intersectionObserver){
				intersectionObserver = new IntersectionObserver(onIntersectionChanged);
			}
			let v = avotter.settings.fetchAfterStayFor, n = v * 1;
			if (v && ! isNaN(n) && n >= 0)
				fetchAfterStayFor = n * 1000;
				
			watchdogStartAt = 0;
			tweetsContainerObserverReady = newTweetDetected = newTweetFetched = false;
			if (! (alreadyRead = currentPage().alreadyRead))
				alreadyRead = currentPage().alreadyRead = {};
			installTweetsMutationObserver();
			tweetsForEach(markAlreadyReadOrObserveIntersection);
			d.addEventListener("visibilitychange", onVisibilityChange);
			window.addEventListener("scroll", onScroll);
			let e = d.querySelector(".avtr-eye-button");
			if (e)
				e.classList.add("avtr-eye-monitoring");
			if (avotter.settings.hideProfileAndPinnedTweetWhenMonitoring){
				if (e = getProfileArea()){
					avtrHide(e);
					if (e = getPinnedTweet()){
						hideTweet(e);
						if (isSeparator(e.nextElementSibling))
							hideTweet(e.nextElementSibling);
					}
				}
			}
			currentPage().monitoring = monitoring = true;
			onScroll();
		}
		
		fetchAndMonitorNewTweet = function(enable)
		{
			if (typeof  enable !== "boolean")
				enable = ! monitoring;
			if (enable)
				startMonitering();
			else
				stopMonitering();
		};
		
		getNewSearchResultCount = function()
		{
			let count = 0;
			if (monitoring){
				tweetsForEach(e=>{
					if (isTweet(e) && isTweetVisible(e)){
						if (! e.classList.contains("avtr-already-read"))
							count++;
						else
							return true; // stop enumeration
					}
				});
			}
			return count > 0 ? count : (d.hidden && newTweetFetched ? 1 : 0);
		};
	})();
	
	//===============================================================
	//  moniter xhr for user
	//===============================================================
	let monitorXhrForUser;

	function addUserProfile(user)
	{
		if (! avotter.users)
			avotter.users = {};
		avotter.users[user.screen_name.toLowerCase()] = user;
	}

	function removeUserProfile(screenName)
	{
		if (screenName && avotter.users)
			delete avotter.users[screenName.toLowerCase()];
	}

	function getUserProfile(screenName)
	{
		return (screenName && avotter.users) ? avotter.users[screenName.toLowerCase()] : null;
	}
	
	function clearUserProfile()
	{
		delete avotter.users;
	}
	
	(function(){
		let handleXhrOpen;
		
		function isTarget(url)
		{
			return /\/(search\/adaptive|timeline\/(home|list|profile\/\d+))\.json/.test(url);
		}
		
		function onXhrOpen(method, url)
		{
			if (method.toUpperCase() === "GET" && isTarget(url)){
				this.addEventListener("load", function(){
					log("xhrForUser.onload");
					try {
						let j = JSON.parse(this.responseText);
						if (j.globalObjects && j.globalObjects.tweets && j.globalObjects.users){
							let a = [];
							Object.keys(j.globalObjects.users).forEach(k=>{
								let user = j.globalObjects.users[k];
								if (user && user.screen_name){
									addUserProfile(user);
									a.push(user.screen_name);
								}
							});
							if (a.length > 0){
								if (!0 /* ! (d.hidden && window.chrome && avotter.settings.monitorXhrInBackground) */){
									setTimeout(function(a){
										a.forEach(sn=>removeUserProfile(sn));
									}, 10*1000, a);
								}
							}
						}
					}
					catch(e){log("#### xhrForUser.onload "+e)}
				});
				log("# listening event 'load' on "+ url.substring(0,50));
			}
		}

		monitorXhrForUser = function(enable){
			if (enable){
				if (! handleXhrOpen){
					log("# monitorXhrForUser starting");
					handleXhrOpen = addObjectMethodMonitor(XMLHttpRequest.prototype, "open", onXhrOpen);
					if (! handleXhrOpen)
						log("# monitorXhrForUser error: addObjectMethodMonitor returned error");
				}
			}
			else {
				if (handleXhrOpen){
					handleXhrOpen.remove();
					handleXhrOpen = null;
					log("# monitorXhrForUser stopped");
				}
			}
		};
	})();

	//===============================================================
	//  moniter non-tweet miscellaneous
	//===============================================================
	let monitorNonTweet, scanNonTweet;
	
	(function(){
		function hidePromotionTrendIn(target)
		{
			if (target){
				let ee = target.querySelectorAll('path[d^="M20.75 2H3.25C2.007"]');
				for (let i = 0 ; i < ee.length ; i++){
					let e = ee[i];
					while (e = e.parentElement){
						if (e.getAttribute("data-testid") === "trend" && isVisible(e)){
							log("hide: " + t2str(e, 50));
							avtrHide(e);
							notifyInButton(++avotter.hiddenItemCount);
							break;
						}
					}
				}
			}
		}
		
		scanNonTweet = function(target){
			if (avotter.settings.hidePromotion)
				hidePromotionTrendIn(target);
		}
		
		monitorNonTweet = function(target, enable){
			if (target){
				let dataTestId = target.getAttribute("data-testid");
				if (enable){
					if (! target.avotterrNonTweetObserver){
						log("# monitorNonTweet("+(dataTestId ? dataTestId : "")+") starting");
						target.avotterrNonTweetObserver = new MutationObserver(function(mutations, observer){
							mutationsChildListForEach(mutations, function(e, type){
								if (e.classList == null)
									return;
								if (avotter.settings.hidePromotion)
									hidePromotionTrendIn(e);
							}, {removedNodes: false});
						});
						target.avotterrNonTweetObserver.observe(target, {childList:true, subtree:true});
						scanNonTweet(target);
					}
				}
				else {
					if (target.avotterrNonTweetObserver){
						target.avotterrNonTweetObserver.disconnect();
						delete target.avotterrNonTweetObserver;
						log("# monitorNonTweet("+(dataTestId ? dataTestId : "")+") stopped");
					}
				}
			}
		};
	})();

	//===============================================================
	//  
	//===============================================================

	function obj2str(o, max_depth)
	{
		if (o == null){
			return "null";
		}
		else {
			if (max_depth == null)
				max_depth = 0;
			else if (max_depth < 0)
				return "{...}";
			let s = "";
			Object.keys(o).forEach(k=>{
				s += ", " + k + ":" + (typeof o[k] === "object" ? obj2str(o[k], --max_depth) : o[k]);
			});
			return "{" + s.substring(2) + "}";
		}
		return 
	}
	
	function page2str(page)
	{
		return obj2str(page, 2);
	}
	
	function printPageStack()
	{
		for (let i = 0 ; i < avotter.page.length ; i++){
			let page = avotter.page[i];
			console.log("%cpage["+i+"] "+page2str(page), i === avotter.pageIndex ? "color:blue":"");
		}
	}

	function printPageStackIfDebug()
	{
		if (avotter.debug)
			printPageStack();
	}
	
	function currentPage()
	{
		return avotter.page[avotter.pageIndex];
	}
	
	function previousPage()
	{
		return avotter.pageIndex > 0 ? avotter.page[avotter.pageIndex - 1] : {state:{}};
	}
	
	function printElementTree(e, depth)
	{
		if (depth == null)
			depth = 0;
		console.log("  ".repeat(depth) + e2str(e));
		for (let i = 0 ; i < e.children.length ; i++){
			printElementTree(e.children[i], depth + 1);
		}
	}
	
	function isUrlOfCompose(url)
	{
		return url && /^\/compose\//.test(url);
	}
	
	function onReactRootChanged(mutations, observer)
	{
		let page = currentPage();
		/*
		log("# onReactRootChanged");
		printMutationsIfDebug(mutations, {removedNodes: prev.modal , filter:function(e){
			return  !/^(IMG)$/.test(e.tagName);
		}});
		*/
		let e, typeAdded, modalAdded, modalRemoved;
		for (let i = 0 ; i < mutations.length ; i++){
			let m = mutations[i];
			if (m.type !== "childList")
				continue;
			if (e = containsElementInNodeList(m.removedNodes, modalSelector)){
				log("## modal-header removed from #react-root");
				modalRemoved = true;
			}
			if (e = containsElementInNodeList(m.addedNodes, modalSelector)){
				log("## modal-header added to #react-root");
				page.modal = modalAdded = true;
			}
			if (e = containsElementInNodeList(m.addedNodes, tweetSelector)){
				log("## tweet added to #react-root");
				page.type = "tweet";
				typeAdded = e;
			}
			if (isTrendPage(location.pathname)){
				if (e = containsElementInNodeList(m.addedNodes, trendSelector)){
					log("## trend added to #react-root");
					page.type = "trend";
					typeAdded = e;
				}
			}
		}
		if (page.modal){
			if (getCloseButton(getModal())){
				log("## modal close button detected. current page is modal");
				onTransitionComplete();
			}
		}
		else if (typeAdded){
			if (isAscendant(getPrimaryColumn(), typeAdded)){
				log("## current page is '"+page.type+"'");
				onTransitionComplete();
			}
		}
		else if (page.type){
			if (modalRemoved)
				onTransitionComplete();
		}
		else if (modalRemoved){
			if (containsElement(getPrimaryColumn(), tweetSelector)){
				log("## tweet found in primaryColumn");
				page.type = "tweet";
				onTransitionComplete();
			}
		}
	}
	
	function moniterReactRoot(enable)
	{
		if (enable){
			if (! avotter.reactRootMonitering){
				let reactRoot = d.querySelector('#react-root');
				if (reactRoot){
					log("# start monitoring #react-root");
					avotter.reactRootMonitering = true;
					avotter.reactRootObserver.observe(reactRoot, {childList:true, subtree:true});
				}
				else
					alert("#react-root " + translate("NotFound"));
			}
		}
		else {
			if (avotter.reactRootMonitering){
				log("# stop monitoring #react-root");
				avotter.reactRootMonitering = false;
				avotter.reactRootObserver.disconnect();
			}
		}
	}
	
	//===============================================================
	//  Moniter page transition
	//===============================================================
	function state2str(o)
	{
		if (o){
			let s = "";
			Object.keys(o).forEach(k=>s += ", "+k+":"+(k==="state"?o2str(o[k]):o[k]));
			return "{" + s.substring(2) + "}";
		}
		else {
			return "null";
		}
	}
	
	let navItem = {
		"/home": true,
		"/explore": true,
		"/notifications": true,
		"/messages": true,
		"/i/bookmarks": true
		/*
		"/(screen name)/lists": !0,
		"/(screen name)": !0,
		"/(screen name)/moments": !0,
		"/(screen name)/settings": !0
		*/
	};
	
	function getScreenName()
	{
		let a = d.querySelector('nav > a[href$="/lists"]');
		return a ? a.getAttribute("href").split("/")[1] : "";
	}
	
	function isNavItem(url)
	{
		if (navItem[url])
			return true;
		let name = getScreenName();
		if (name && url[0] === "/" && url.substring(1, name.length + 1) === name){
			let sub = {"/lists": true, "": true, "/moments": true, "/settings": true};
			return !! sub[url.substring(1 + name.length)];
		}
		return false;
	}
	
	function isTrendPage(url)
	{
		return /^\/(explore|i\/trends)$/.test(url);
	}
	
	function isNonModalUrl(url)
	{
		return /^\/\w+\/status\/\d+$/.test(url);
	}
	
	function needsMonitoringTweet()
	{
		let page = currentPage();
		return ! page.modal && page.type === "tweet" && (avotter.settings.hidePromotion || avotter.settings.hideRecommendedUser || avotter.settings.fitImageToArea || avotter.addonNeedsTweet);
	}
	
	function onTransitionComplete()
	{
		let page = currentPage();
		log("======== transition completed ========");
		moniterReactRoot(false);
		avotter.pageTitle = document.title.replace(/^\(\d+\)/,"");
		printPageStackIfDebug();
		installNotificationWatcher();
		avotterButtonAddClass("avtr-transition-complete");
		notifyInButton(avotter.hiddenItemCount);
		if (isMobile()){
			removeFetchAndMonitorButtonFromPage();
			removeHomeButtonFromPage();
		}
		if (page.modal){
			showGoTopBackButton({top:"hide", back:"hide"});
			if (! isMobile() && avotter.settings.closeModalDialogByDoubleClick){
				installModalDialogHandler();
			}
		}
		else {
			if (page.type === "tweet"){
				if (needsMonitoringTweet())
					monitorTweet(true);
				if (avotter.settings.addFetchAndMonitorButton){
					addFetchAndMonitorButtonToPage();
					if (page.monitoring)
						fetchAndMonitorNewTweet(true);
				}
			}
			if (avotter.settings.hidePromotion){
				monitorNonTweet(getSidebarColumn(), true);
				if (isTrendPage(location.pathname)){
					monitorNonTweet(getPrimaryColumn(), true);
				}
			}
			if (isMobile() && avotter.settings.addHomeButton)
				addHomeButtonToPage();
			showGoTopBackButton();
		}
	}
	
	function onPageTrasition(method, state, title, url)
	{
		log("## " + method + " state:"+state2str(state)+" title:"+title+" url:"+url);
		if (state){ // transition by twitter app. when browser go/back button is used state is null.
			if (state.state && state.state.searchFocused != null){
				if (url === currentPage().url){
					log("# url not changed. only searchFocused state changed");
					return;
				}
				else {
					if (method === "replaceState"){
						method = "pushState";
						log("# corrected from replaceState to pushState in searchFocused mode");
					}
				}
			}
		}
		let prev = currentPage(), modalOnTypeClosed, tweetOnModalClosed, pushedOnModal;
		monitorTweet(false);
		monitorNonTweet(getPrimaryColumn(), false);
		monitorNonTweet(getSidebarColumn(), false);
		let prev_monitoring = prev.monitoring;
		fetchAndMonitorNewTweet(false);
		prev.monitoring = prev_monitoring;
		showGoTopBackButton({top:"hide", back:"hide"});
		let page = {
			//type: null,
			state: state, 
			title: title, 
			url: url
		};
		if (method === "pushState"){
			if (page.state){
				if (prev.modal != null && page.state.state && page.state.state.previousPath === prev.url)
					page.modal = prev.modal;
				if (isNonModalUrl(url))
					page.modal = false;
				if (isNavItem(page.url)){
					avotter.page = [];
				}
				else {
					pushedOnModal = !! prev.modal;
				}
				avotter.pageIndex = avotter.page.push(page) - 1;
			}
		}
		else if (method === "replaceState"){
			if (avotter.page[avotter.pageIndex].modal != null)
				page.modal = avotter.page[avotter.pageIndex].modal;
			avotter.page[avotter.pageIndex] = page;
		}
		else { // if (method === "popstate")
			let found;
			for (let i = avotter.page.length - 1 ; i >= 0 ; i--){
				if (! avotter.page[i].state || ! page.state)
					continue;
				if (avotter.page[i].state.key && avotter.page[i].state.key === page.state.key){
					found = true;
					if (prev.modal && (! avotter.page[i].modal && avotter.page[i].type))
						modalOnTypeClosed = avotter.page[i].type;
					if (! prev.modal && prev.type === "tweet" && avotter.page[i].modal)
						tweetOnModalClosed = true;
					avotter.pageIndex = i;
					let ascendant = {};
					ascendant[avotter.page[i].url] = true;
					for (++i ; i < avotter.page.length ; i++){
						let descendant = avotter.page[i];
						if (descendant.state.state && ascendant[descendant.state.state.previousPath]){
							ascendant[descendant.url] = true;
							avotter.page.splice(i--, 1);
						}
					}
					break;
				}
			}
			if (! found)
				avotter.pageIndex = avotter.page.push(page) - 1;
		}
		log("======== transition started ========");
		printPageStackIfDebug();
		if (modalOnTypeClosed){
			log("## modal on "+modalOnTypeClosed+" closed");
			if (! getModal()){
				log("## and modal not found");
				onTransitionComplete();
				return;
			}
		}
		if (tweetOnModalClosed){
			log("## tweets on modal closed");
			if (getCloseButton(getModal())){
				log("## and modal close button found");
				onTransitionComplete();
				return;
			}
		}
		if (pushedOnModal){
			log("## some pushed on modal");
			if (! getModal()  && containsElement(getPrimaryColumn(), tweetSelector)){
				log("## and modal not found. and tweet found in primaryColumn");
				page.type = "tweet";
				onTransitionComplete();
				return;
			}
		}
		moniterReactRoot(true);
		avotterButtonRemoveClass("avtr-transition-complete");
	}
	
	function onHistoryPushState(state, title, url)
	{
		onPageTrasition("pushState", state, title, url);
	}
	
	function onHistoryReplaceState(state, title, url)
	{
		onPageTrasition("replaceState", state, title, url);
	}
	
	function onWindowPopstate()
	{
		//if (! event.state) return;
		let url = location.pathname+location.search;
		onPageTrasition("popstate", event.state, null, url);
	}
	
	//===============================================================
	// display unread tweets/nitifications/dm count in tab
	//===============================================================
	let installNotificationWatcher, notifyInTab, clearNotifyInTab, initEmojiForNotification;
	
	(function(){
		clearNotifyInTab= function()
		{
			d.title = avotter.pageTitle;
		}
		
		let emojiForNotification;
		
		initEmojiForNotification = function()
		{
			emojiForNotification = [];
			let a = (avotter.settings.emojiForNotification + ",,,").split(",");
			for (let i = 0 ; i < 4 ; i++){
				emoji = a[i].trim();
				emojiForNotification.push(emoji ? emoji : defaultEmojiForNotification[i]);
			}
		}
		
		notifyInTab = function()
		{
			if (! emojiForNotification)
				initEmojiForNotification();
			let emoji = emojiForNotification;
			
			let e, s = ""
			let nNewSearchResults = getNewSearchResultCount();
			e = d.querySelector('.avtr-eye-new-arrivals');
			if (nNewSearchResults > 0){
				s += emoji[0] + (nNewSearchResults > 1 ? nNewSearchResults : "");
				if (e){
					e.innerText = nNewSearchResults;
					e.classList.remove('avtr-hide');
				}
			}
			else {
				if (e){
					e.innerText = "";
					e.classList.add('avtr-hide');
				}
			}
			
			if (avotter.settings.showArrivalOfNewTweetsInTab){
				e = d.querySelector('a[data-testid="AppTabBar_Home_Link"] svg + div');
				let newTweetCount = e != null ? "1" : "";
				if (newTweetCount > 0)
					s += emoji[1] + (newTweetCount > 1 ? newTweetCount : "");
				e = d.querySelector('a[data-testid="AppTabBar_Notifications_Link"] svg + div');
				let notificationsCount = e ? e.innerText : "";
				if (notificationsCount > 0)
					s += emoji[2] + (notificationsCount > 1 ? notificationsCount : "");
				e = d.querySelector('a[data-testid="AppTabBar_DirectMessage_Link"] svg + div');
				let directMessageCount = e ? e.innerText : "";
				if (directMessageCount > 0)
					s += emoji[3] + (directMessageCount > 1 ? directMessageCount : "");

				let title = d.title = (s ?  s + " " : "")+ avotter.pageTitle;
				function oneMoreTime(){d.title = title}
				setTimeout(oneMoreTime, 1000);
			}
		}
		
		function isTargetedIconMutation(mutations)
		{
			for (let i = 0 ; i < mutations.length ; i++){
				let m = mutations[i];
				if (m.type === "childList"){
					function isTarget(e, prev)
					{
						return e.tagName === "DIV" && prev && prev.tagName === "svg";
					}
					for (let j = 0 ; j < m.addedNodes.length ; j++){
						if (isTarget(m.addedNodes[j], m.previousSibling))
							return true;
					}
					for (let j = 0 ; j < m.removedNodes.length ; j++){
						if (isTarget(m.removedNodes[j], m.previousSibling))
							return true;
					}
				}
				else if (m.type === "characterData"){
					return true;
				}
			}
			return false;
		}
		
		function onHomeIconChanged(mutations, observer)
		{
			if (avotter.settings.showArrivalOfNewTweetsInTab){
				log("## onHomeIconChanged");
				printMutationsIfDebug(mutations);
				if (isTargetedIconMutation(mutations))
					notifyInTab();
			}
		}
		
		function onNotificationsIconChanged(mutations, observer)
		{
			if (avotter.settings.showArrivalOfNewTweetsInTab){
				log("## onNotificationsIconChanged");
				printMutationsIfDebug(mutations);
				if (isTargetedIconMutation(mutations))
					notifyInTab();
			}
		}
		
		function onDirectMessageIconChanged(mutations, observer)
		{
			if (avotter.settings.showArrivalOfNewTweetsInTab){
				log("## onDirectMessageIconChanged");
				printMutationsIfDebug(mutations);
				if (isTargetedIconMutation(mutations))
					notifyInTab();
			}
		}
		
		installNotificationWatcher = function(){
			let error;
			[	{name: "Home", callback: onHomeIconChanged}, 
				{name: "Notifications", callback: onNotificationsIconChanged}, 
				{name: "DirectMessage", callback: onDirectMessageIconChanged}
			].forEach(item=>{
				let e = d.querySelector('a[data-testid="AppTabBar_' + item.name + '_Link"]')
				if (e){
					if (! e.avotterObserver)
						installMutationObserver(e, item.callback,  {childList:true, characterData:true, subtree:true});
				}
			});
			return ! error;
		};
	})();

	//===============================================================
	//  eye button
	//===============================================================
	function addFetchAndMonitorButtonToPage()
	{
		if (! d.querySelector('.avtr-eye-button')){
			let e, ee = d.querySelectorAll('div[aria-label][role="button"]');
			for (let i = 0 ; i < ee.length ; i++){
				if (ee[i].querySelector('path[d^="M20 11H7.414l4.293-4.293c.39-.39.39-1.023"')
					|| ee[i].querySelector('path[d^="M22.772 10.506l-5.618-2.192-2.16-6.5c-.102-"')){
					e = ee[i];
					break;
				}
			}
			e && (e = e.parentElement) && (e = e.parentElement.lastElementChild);
			if (e.querySelector('svg'))
				e = e.previousElementSibling;
			if (e){
				let eyeButton = d.createElement("div");
				eyeButton.innerHTML = '<svg viewBox="0 0 48 48" class="avtr-svg-eye"><g><path d="M1.0926833897829056,23.648780494928356a23.950846191871435,23.950846191871435,0,0,0,45.50243906676769,-0.46829268336295726a28.31901480790745,28.31901480790745,0,0,0,-22.712195143103596,-15.843902453780174a21.973728112309484,21.973728112309484,0,0,1,1.248780488967892,31.219512224197388a21.50323079364973,21.50323079364973,0,0,1,-1.7170731723308563,-31.29756100475788a25.225780670556606,25.225780670556606,0,0,0,-22.24390245974064,16.390243917703625"></path></g></svg><span class="avtr-eye-new-arrivals avtr-hide"></span><span class="avtr-eye-countdown avtr-hide"></sapn>';
				eyeButton.className = "avtr-eye-button";
				if (e.nextElementSibling)
					e.parentElement.insertBefore(eyeButton, e.nextElementSibling);
				else
					e.parentElement.appendChild(eyeButton);
				eyeButton.addEventListener("click", fetchAndMonitorNewTweet);
			}
		}
	}

	function removeFetchAndMonitorButtonFromPage()
	{
		let e = d.querySelector('.avtr-eye-button');
		if (e)
			e.remove();
	}
		
	//===============================================================
	//  home button
	//===============================================================
	function addHomeButtonToPage()
	{
		let e;
		if (d.querySelector('a[data-testid="AppTabBar_Home_Link"]')){
			if (e = d.querySelector('.avtr-home-button'))
				e.remove();
		}
		else if (! d.querySelector('.avtr-home-button')){
			let ee = d.querySelectorAll('div[aria-label][role="button"]');
			for (let i = 0 ; i < ee.length ; i++){
				if (ee[i].querySelector('path[d^="M20 11H7.414l4.293-4.293c.39-.39.39-1.023"')){
					e = ee[i];
					break;
				}
			}
			if (e){
				if ((e = e.parentElement) && e.parentElement && e.nextElementSibling){
					let homeButton = d.createElement("div");
					homeButton.innerHTML = '<svg viewBox="0 0 48 48" class="avtr-home-button"><g><path d="M2.341463878750801,21.697560980916023l18.88780489563942,-17.79512196779251a1.7669044188431138,1.7669044188431138,0,0,1,2.419512197375301,0l21.541463434696194,17.56097562611103a0.6863471497567665,0.6863471497567665,0,0,1,-0.07804878056049347,1.0926829278469086l-6.321951225399971,-0.07804878056049347l-0.6243902444839478,21.775609776377678l-12.956097573041916,0l0,-8.273170739412308a7.194782,7.194782,0,0,0,-0.07804878056049347,-14.360975623130798l-0.7024390250444412,0a7.200708,7.200708,0,1,0,-3.552713678800501e-15,14.360975623130798l0.1560975611209905,8.195121958851814l-13.892682939767838,-0.07804878056049347l-1.170731708407402,-21.15121953189373l-7.024390250444412,0a0.6946341469883932,0.6946341469883932,0,0,1,0,-1.2487804889678955"></path></g></svg>';
					let svg = homeButton.querySelector("svg");
					homeButton.className = "avtr-home-button";
					e.parentElement.insertBefore(homeButton, e.nextElementSibling);
					homeButton.addEventListener("click", ()=>dispatchKeystroke(document, "gh"));
				}
			}
		}
	}
	
	function removeHomeButtonFromPage()
	{
		let e = d.querySelector('.avtr-home-button');
		if (e)
			e.remove();
	}
	
	//===============================================================
	//  go top button
	//===============================================================
	var goTopTimer;
	
	function getTwitterBackButton()
	{
		let e = d.querySelector('div[data-testid="primaryColumn"] div[role="button"] > div > svg > g > path[d^="M20 11H7.414l4.293-4.293c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414"]');
		return e ? e.parentElement.parentElement.parentElement.parentElement : null;
	}
	
	function needsToShowTopButton()
	{
		return avotter.settings.addGoTopButton && (window.pageYOffset > window.innerHeight * 0.5);
	}
	
	function canShowBackButton()
	{
		return avotter.settings.addGoTopButton && ! isMobile() && avotter.settings.goTopButtonAtMousePosition && getTwitterBackButton();
	}

	function showGoTopBackButton(cmd)
	{
		if (cmd == null)
			cmd = {};
		let showTopButton = cmd.top === "show" ? true : cmd.top === "hide" ? false : needsToShowTopButton(), showBackButton;
		if (! isMobile())
			showBackButton = canShowBackButton() ? cmd.back !== "hide" : false;
		let e = d.querySelector('.avtr-gotop-button'), backButton, topButton;
		if (! e){
			if (! (showTopButton || showBackButton))
				return;
			e = d.createElement("div");
			e.innerHTML = (! isMobile() ? '<div class="avtr-arrow-button"><svg viewBox="0 0 48 48" class="avtr-svg-arrow"><g><path  class="avtr-path-left" d="M5.2292687594890594,21.073170736432076l18.341463431715965,-17.170731723308563l18.965853676199913,17.248780503869057l-2.341463416814804,2.2634146362543106l-14.907317087054253,-13.424390256404877l1.6390243917703629,33.873170763254166l-3.668292686343193,0l-1.404878050088879,-34.18536588549614l-14.048780500888828,13.346341475844383l-2.341463416814804,-2.185365855693817" /></g></svg></div>' : "") + '<div class="avtr-arrow-button"><svg viewBox="0 0 48 48" class="avtr-svg-arrow"><g><path d="M5.2292687594890594,21.073170736432076l18.341463431715965,-17.170731723308563l18.965853676199913,17.248780503869057l-2.341463416814804,2.2634146362543106l-14.907317087054253,-13.424390256404877l1.6390243917703629,33.873170763254166l-3.668292686343193,0l-1.404878050088879,-34.18536588549614l-14.048780500888828,13.346341475844383l-2.341463416814804,-2.185365855693817"/></g></svg></div>';
			e.className = "avtr-gotop-button";
			if (isMobile()){
				e.style.bottom = "4rem";
				topButton = e.firstElementChild;
				topButton.addEventListener("click",()=>scrollTo(0,0));
				topButton.classList.add("avtr-mobile");
				topButton.querySelector("svg").classList.add("avtr-mobile");
			}
			else {
				backButton = e.firstElementChild;
				topButton = e.lastElementChild;
				topButton.addEventListener("click",()=>scrollTo(0,0));
				backButton.addEventListener("click",()=>{
					let back = getTwitterBackButton();
					back && back.click();
				});
			}
			document.body.appendChild(e);
		}
		else {
			if (! isMobile()){
				backButton = e.firstElementChild;
				topButton = e.lastElementChild;
			}
		}
		if (isMobile()){
			e.style.top = e.style.left = "";
			avtrShow(e, showTopButton);
		}
		else {
			if (avotter.settings.goTopButtonAtMousePosition){
				e.style.top = avotter.mouseTop - 10 + "px";
				e.style.left = avotter.mouseLeft - 10 + "px";
			}
			else {
				e.style.top = e.style.left = "";
			}
			 avtrShow(topButton, showTopButton);
			 avtrShow(backButton, showBackButton);
			 avtrShow(e, (showTopButton || showBackButton));
		}
	}

	function onScrollForGoTopButton()
	{
		if (! goTopTimer){
			showGoTopBackButton();
			goTopTimer = setTimeout(function(){goTopTimer=null}, 200);
		}
	}
	
	function onMouseMoveForGoTopButton()
	{
		avotter.mouseLeft = event.pageX - window.pageXOffset;
		avotter.mouseTop = event.pageY - window.pageYOffset;
	}
	
	//===============================================================
	//  
	//===============================================================
	function hookVisibilityState()
	{
		let owner = document, prop =  "visibilityState",
			desc = Object.getOwnPropertyDescriptor(owner, prop);
		if (desc === undefined || desc.get === undefined) {
			Object.defineProperty(owner,  prop, {
				get: function(){
					return avotter.settings.forceWorkingInBackground || ! d.hidden ? "visible" : "hidden" ;
				}
			});
		}
	}
	
	//===============================================================
	//  Initialize App
	//===============================================================
	function init()
	{
		"use strict";
		window["avotter"] = {
			pageTitle: "",
			page: [],
			hiddenItemCount: 0,
			settings: {
				hidePromotion: true,
				hideRecommendedUser: true,
				fitImageToArea: true,
				delayForFitImage: defaultDelayForFitImage,
				addFetchAndMonitorButton: true,
				fetchAfterStayFor: defaultFetchAfterStayFor,
				hideProfileAndPinnedTweetWhenMonitoring: true,
				monitorXhrInBackground: false,
				showArrivalOfNewTweetsInTab: true,
				emojiForNotification: defaultEmojiForNotification.join(","),
				addHomeButton: true,
				addGoTopButton: true,
				goTopButtonAtMousePosition: false,
				closeModalDialogByDoubleClick: true,
				forceWorkingInBackground: false,
				storeSettingsInBrowser: false
			},
			addon: [],
			addAddon: function(addon){
				if (! addon || ! addon.name){
					log("# addon is null or has no name");
					return;
				}
				avotter.addon[addon.name] = addon;
				avotter.addonNeedsTweet = false;
				let needsProfile;
				Object.keys(avotter.addon).forEach(k=>{
					let a = avotter.addon[k];
					if (typeof a.hideThisTweet === "function")
						avotter.addonNeedsTweet = true;
					if (a.option && a.option.userProfile)
						needsProfile = true;
				});
				monitorTweet(needsMonitoringTweet());
				monitorXhrForUser(needsProfile);
				if (! needsProfile){
					clearUserProfile();
				}
				if (typeof addon.initialize === "function")
					addon.initialize();
				if (typeof addon.hideThisTweet === "function")
					scanTweets();
			},
			addonNeedsTweet: false,
			// for debugging
			getTweetsContainer: getTweetsContainer,
			tweetsForEach: tweetsForEach,
			scanTweets: scanTweets,
			t2str: t2str,
			dispatchKeystroke: dispatchKeystroke,
			printTweets: printTweets,
			printPageStack: printPageStack
		};
		
		appendStylesheet(
			'.avtr-hide{display:none}'
			+'.avtr-main-button{position:relative;cursor:pointer;padding:0.2rem 0.3rem 0 0.3rem;border:1px solid;border-radius:50%;background-color:gold;'+(!isMobile()?'margin-top:0.5rem':'')+'}.avtr-main-button.avtr-mobile{height:50%;margin:3% 4%}'
			+'.avtr-svg-av{width:1.2rem}'
			+'.avtr-sup{position:absolute;right:-15px;top:-12px;min-width:16px;padding:3px;text-align:center;border-radius:50%;background-color:blue;color:white;font:small-caps bold 12px sans-serif}'
			+'@keyframes blink{0%{opacity:0.5}50%{opacity:1}}.avtr-blink{animation:blink 1s step-end infinite}'
			+'.avtr-monitoring{background-color:yellow!important}'
			+'.avtr-transition-complete{background-color:gold}'
			+'.avtr-search-add{background-color:linen}'
			+'.avtr-already-read{background-color:#f0f0f0}'
			+'.avtr-home-button{margin:auto 5px auto -5px;height:1.75rem;color:gold;fill:currentcolor}'
			+'.avtr-eye-button{position:relative;cursor:pointer;width:2rem;padding:0.3rem 0 0 0.3rem;fill:gold}.avtr-svg-eye{height:1.8rem}.avtr-eye-monitoring{background-color:black}.avtr-eye-new-arrivals{position:absolute;width:1.5rem;top:-0.2rem;right:-1rem;text-align:center;border-radius:50%;color:red;background-color:red;color:white;font:small-caps bold 1rem sans-serif}.avtr-eye-countdown{position:absolute;width:1.4rem;top:0.6rem;left:0.3rem;text-align:center;border-radius:50%;color:red;background-color:gold;font:small-caps bold 0.9rem sans-serif}'
			+'.avtr-gotop-button{position:fixed;bottom:1rem;left:1rem;z-index:3;}.avtr-arrow-button{width:2rem;height:2rem;text-align:center;background-color:gold;cursor:pointer;border-radius:50%;}.avtr-arrow-button.avtr-mobile{width:2.6rem!important;height:2.6rem!important}.avtr-svg-arrow.avtr-mobile{margin-top:0.3rem}.avtr-svg-arrow{width:1.8rem}.avtr-path-left{transform-origin:50% 50%;transform:rotate(272deg);}'
		);

		// add avotter settings button
		loadAvotterSettings();
		addAvotterButtonToPage();
		notifyInButton(avotter.hiddenItemCount);

	
		// moniter transition
		addObjectMethodMonitor(window.history, "pushState", onHistoryPushState);
		addObjectMethodMonitor(window.history, "replaceState", onHistoryReplaceState);
		window.addEventListener("popstate", onWindowPopstate);
		
		// prepare to monitor react-root
		avotter.reactRootObserver = new MutationObserver(onReactRootChanged);
		
		avotter.pageIndex = avotter.page.push({
			type: getPageType(),
			state: window.history.state ? window.history.state : {},
			title: null, 
			url: location.pathname+location.search
		}) - 1;
		let page = currentPage();
		if (getModal())
			page.modal = true;
		
		// moniter nav icons to detect notification
		installNotificationWatcher();
		
		//
		hookVisibilityState();
		
		if (avotter.settings.addGoTopButton){
			window.addEventListener("scroll", onScrollForGoTopButton);
			if (! isMobile() && avotter.settings.goTopButtonAtMousePosition)
				d.addEventListener("mousemove", onMouseMoveForGoTopButton);
		}
		
		//avotter.debug = true;
		
		if (page.modal || page.type)
			onTransitionComplete();
	}
	
	if (!/^(mobile\.)?twitter\.com$/i.test(location.hostname)){
		alert(translate("this site is not twitter"));
		return;
	}
		
	if (window["avotter"]){
		if (avotter.fatalError){
			alert(avotter.fatalError+"\n"+ translate("ExitApp"));
			return;
		}
		let page = currentPage();
		if (! (page.modal || page.type)){
			if (getModal())
				page.modal = true;
			page.type = getPageType();
			if (page.modal || page.type)
				onTransitionComplete();
		}
		return;
	}
	
	let reactRoot = d.querySelector('#react-root');
	if (! reactRoot){
		alert("#react-root " + translate("NotFound")+"\n"+ translate("ExitApp"));
		return;
	}
	if (loadingContents(reactRoot)){
		console.log("# still loading contents");
		new MutationObserver(function(mutations, observer){
			if (! loadingContents(reactRoot)){
				observer.disconnect();
				delete observer;
				init();
			}
		}).observe(reactRoot, {childList:true, subtree:true});
	}
	else {
		init();
	}
})();
