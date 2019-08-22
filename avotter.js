/*
{
	name: Avotter
	version: 0.3.5
	author: avotoko
	description: Improve the usability of twitter.com (new design of 2019)
}
*/
(function(){
	let d = document;

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
		return ! isHidden(e);
	}
	
	function hasPreviousVisibleSibling(e)
	{
		while (e = e.previousElementSibling){
			if (isVisible(e))
				return true;
		}
		return false;
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
	
	function containsElement(ee, selector)
	{
		if (ee.constructor.name !== "NodeList")
			ee = [ee];
		for (let i = 0 ; i < ee.length ; i++){
			let e = ee[i];
			if (! e.querySelector) // text node etc.,
				continue;
			if (e.querySelector(selector))
				return e;
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
	
	function moniterObjectMethod(obj, funcName, moniter)
	{
		if (obj && typeof obj[funcName] === "function"){
			let originalFunc = obj[funcName];
			obj[funcName] = function(){
				moniter.apply(this, arguments);
				return originalFunc.apply(this, arguments);
			};
		}
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

	function log(s)
	{
		if (avotter.debug)
			console.log(s);
	}
	
	//===============================================================
	//  Languages
	//===============================================================
	var jpMessageTable = {
		"hidePromotion": "プロモーションを非表示",
		"hideRecommendedUser": "おすすめユーザーを非表示",
		"fitImageToArea": "画像を枠内に収める",
		"addFetchAndMonitorButton": "自動更新新着監視ボタンを表示",
		"fetchAfterStayFor": "┗監視中更新実行までの文書先頭滞在時間（秒）",
		"hideProfileAndPinnedTweetWhenMonitoring": "┗監視中はプロフィールと固ツイを非表示",
		"showArrivalOfNewTweetsInTab": "監視中新着数/TL新着有無/通知数/DM数をタブに表示する",
		"emojiForNotification": "┗上記表示用絵文字（監視中新着,TL新着,通知,DM）",
		"forceWorkingInBackground": "バックグラウンドでも通知等を取得させる",
		"addHomeButton": "戻るボタンの横にホームボタンを表示",
		"addGoTopButton": "文書先頭に行くボタンを表示",
		"closeModalDialogByDoubleClick": "ポップアップをダブルクリックで閉じる",
		"storeSettingsInBrowser": "設定を保存する",
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
	function avtrHide(e)
	{
		e.classList.add("avtr-hide");
	}

	function avtrShow(e)
	{
		e.classList.remove("avtr-hide");
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
		e.innerHTML = '<div class="avtr-alert"><div>Avotter '+translate(title)+'</div><hr /><span class="avtr-alert-msg"></span></p><button type="button">Close</button></div>';
		e = e.firstChild;
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
		if (k === "fetchAfterStayFor"){
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
			needToScan = false;
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
			}
			avotter.settings[k] = v;
		}
		if (avotter.settings.storeSettingsInBrowser)
			saveAvotterSettings();
		else
			clearAvotterSettings();
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
		if (avotter.settings.addGoTopButton != prev.addGoTopButton){
			if (avotter.settings.addGoTopButton){
				window.addEventListener("scroll", onScrollForGoTopButton);
				onScrollForGoTopButton();
			}
			else {
				window.removeEventListener("scroll", onScrollForGoTopButton);
				onScrollForGoTopButton();
				hideGoTopButton();
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
		e.innerHTML = '<div id="avtr-settings" class="avtr-settings"><span class="avtr-settings-title">Avotter v.0.3.5 '+translate("Settings")+'</span><hr/><div class="avtr-settings-items"></div><div style="text-align:center"><button type="button" class="avtr-apply-and-close"></button><button type="button" class="avtr-close"></button></div></div>';
		var menu = e.firstElementChild, items = "";
		if (isMobile())
			menu.classList.add("avtr-mobile");
		Object.keys(avotter.settings).forEach(function(k){
			let v = avotter.settings[k];
			if (isMobile()){
				if (k === "closeModalDialogByDoubleClick")
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
			let parent = d.querySelector('nav');
			if (! isMobile()){
				//parent = parent.parentElement.parentElement;
			}
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
	//  moniter tweets
	//===============================================================
	let monitorTweet, scanTweets;
	
	(function(){
		function fitImageToArea(tw, restore)
		{
			log("# "+(restore ? "restor":"fit")+"ing image in "+t2str(tw,50));
			let ee = tw.querySelectorAll('div[style*="margin"] > div[style*="background-image"] + img[src*="twimg.com/media/"]');
			for (let i = 0 ; i < ee.length ; i++){
				e = ee[i].parentElement;
				if (! restore){
					if (! e.avotterStyle){
						e.avotterStyle = e.getAttribute("style");
						e.setAttribute("style", "margin:;"); // set dummy for above querySelectorAll
						e.firstElementChild.style.backgroundSize = "contain";
					}
				}
				else {
					if (e.avotterStyle){
						e.setAttribute("style", e.avotterStyle);
						delete e.avotterStyle;
						e.firstElementChild.style.backgroundSize = "";
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
				avtrHide(e);
				if (r.promotion)
					notifyInButton(++avotter.hiddenPromotionCount);
			}
		}
		
		function hideOrShow(e, prev, next)
		{
			let r = doesNeedToHide(e, prev, next);
			if (r){
				avtrHide(e);
				if (r.promotion)
					notifyInButton(++avotter.hiddenPromotionCount);
			}
			else
				avtrShow(e);
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
					setTimeout(fitImageToArea, 500, e);
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
					setTimeout(fitImageToArea, 500, e);
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
				}
			}
		}
		
		monitorTweet = function(enable){
			let tweetsContainer = getTweetsContainer();
			if (tweetsContainer){
				if (enable){
					if (! tweetsContainer.avotterMoniteringTweet){
						log("# monitorTweet started");
						if (! tweetsContainer.avotterHookedTweet){
							moniterObjectMethod(tweetsContainer, "insertBefore", onInsertBefore);
							moniterObjectMethod(tweetsContainer, "appendChild", onAppendChild);
							moniterObjectMethod(tweetsContainer, "removeChild", onRemoveChild);
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
	function installModalDialogHandler()
	{
		let m = document.querySelector('div[aria-modal="true"]');
		if (m && ! m.avotterHandlingDblClick){
			log("# installing modal dialog handler");
			m.avotterHandlingDblClick = true;
			m.addEventListener("dblclick", function(){
				let ee = m.querySelectorAll('div[role="button"]');
				for (let i = 0 ; i < ee.length ; i++){
					if (ee[i].querySelector('path[d^="M13.414 12l5.793-5.793c.39-.39.39-1.023"]')){
						setTimeout(function(e){e.click()}, 0, ee[i]);
						break;
					}
				}
			});
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
			newTweetDetected, alreadyRead = {}, intersectionObserver, pageUrl;
		
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
			newTweetDetected = false;
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
			let e = d.querySelector(".avtr-eye-button .avtr-eye-countdown");
			if (e)
				e.classList.add("avtr-hide");
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
		
		function markAlreadyReadOrObserveIntersection(e)
		{
			let id = tweetIdOf(e);
			if (id){
				if (isHidden(e)){
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
					if (! lastReadTweet.parentElement || hasPreviousVisibleSibling(lastReadTweet)){
						newTweetDetected = true;
						log("#### new tweet detected");
						lastReadTweet = null;
						stopWatchdog();
					}
				}
			}
			notifyInTab()
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
					log(e.intersectionRatio.toString().substring(0,5)+" "+t2str(e.target, 50));
					if (e.target.avotterAlreadyRead){
						if (e.intersectionRatio === 0){
							log("^ added class 'avtr-already-read'");
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
							log("^ added to alreadyRead");
							/*
							if (e.intersectionRatio === 1){
								markAlreadyReadAfter(e.target);
								markAfter++;
							}
							*/
						}
						else {
							log("#### ^ can't retrieve tweet id");
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
					if (isVisible(e) && ! e.classList.contains("avtr-already-read")){
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
							// hidden tweets never removed. so display them and force twitter to remove them
							if (isHidden(e) && i > 30)
								e.style.display = "block";
						}
						if (tweetsContainer.firstElementChild !== lastReadTweet){
							if (lastReadTweet = tweetsContainer.firstElementChild){
								log("lastReadTweet: " + t2str(lastReadTweet));
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
			//let e = d.querySelector(".avtr-svg-eye");
			//if (e) e.style.fill = "black";
			e = d.querySelector('a[href$="/header_photo"]');
			if (e && (e = e.parentElement) && isHidden(e)){
				avtrShow(e);
				tweetsForEach(tw=>{
					if (tw.querySelector('path[d^="M20.235 14.61c-.375-1.745-2.342-3.506-4.01-4.125l-."]')){
						avtrShow(tw);
						return true;  // stop enumeration
					}
				});
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
			tweetsContainerObserverReady = newTweetDetected = false;
			if (pageUrl !== location.pathname + location.search){
				pageUrl = location.pathname + location.search;
				alreadyRead = {};
			}
			installTweetsMutationObserver();
			tweetsForEach(markAlreadyReadOrObserveIntersection);
			d.addEventListener("visibilitychange", onVisibilityChange);
			window.addEventListener("scroll", onScroll);
			let e = d.querySelector(".avtr-eye-button");
			if (e)
				e.classList.add("avtr-eye-monitoring");
			if (avotter.settings.hideProfileAndPinnedTweetWhenMonitoring){
				e = d.querySelector('a[href$="/header_photo"]');
				if (e && (e = e.parentElement)){
					avtrHide(e);
					tweetsForEach(tw=>{
						if (tw.querySelector('path[d^="M20.235 14.61c-.375-1.745-2.342-3.506-4.01-4.125l-."]')){
							avtrHide(tw);
							return true;  // stop enumeration
						}
					});
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
				tweetsForEach(e=>{isVisible(e) && ! e.classList.contains("avtr-already-read") && ++count});
			}
			return count;
		};
	})();
	
	//===============================================================
	//  
	//===============================================================
	function t2str(e, len)
	{
		if (e == null)
			return "null";
		return e.innerText.replace(/\s+/g," ").substring(0, len != null ? len : undefined);
	}
	
	function getPrimaryColumn()
	{
		return d.querySelector('div[data-testid="primaryColumn"]');
	}
	
	function getTweetsContainer()
	{
		let pc = getPrimaryColumn();
		return pc ? pc.querySelector('h1[aria-level="1"] + div > div:first-child > div:first-child') : null;
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
		tweetsForEach(e=>console.log((isHidden(e) ? "[hidden]" : e.classList.contains("avtr-already-read")?"[Read]":"[Unread]")+" "+t2str(e,50)))
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
	
	function containsTweet(ee)
	{
		return containsElement(ee, 'div[data-testid="tweet"]');
	}
	
	function containsModalHeader(ee)
	{
		return containsElement(ee, 'div[aria-labelledby="modal-header"]');
	}

	function getPageType()
	{
		let type = null;
		if (containsModalHeader(d)){
			//type = "modal";
		}
		else if (containsTweet(d)){
			type = "tweet";
		}
		return type
	}
	
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
	
	function printPageStackIfDebug()
	{
		if (avotter.debug){
			for (let i = 0 ; i < avotter.page.length ; i++){
				let page = avotter.page[i];
				console.log("%cpage["+i+"] "+page2str(page), i === avotter.pageIndex ? "color:blue":"");
			}
		}
	}
	
	function currentPage()
	{
		return avotter.page[avotter.pageIndex];
	}
	
	function previousPage()
	{
		return avotter.pageIndex > 0 ? avotter.page[avotter.pageIndex - 1] : {state:{}};
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
		let e, typeDetected;
		for (let i = 0 ; i < mutations.length ; i++){
			let m = mutations[i];
			if (m.type !== "childList")
				continue;
			if (e = containsModalHeader(m.addedNodes)){
				log("## modal-header added under "+e2str(e));
				page.modal = true;
			}
			if (e = containsTweet(m.addedNodes)){
				log("## tweet added under "+e2str(e));
				page.type = "tweet";
				typeDetected = true;
			}
		}
		if (page.modal){
			onTransitionComplete();
		}
		else if (page.type === "tweet"){
			if (typeDetected || getTweetsContainer())
				onTransitionComplete();
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
	
	function isNonModalUrl(url)
	{
		return /^\/\w+\/status\/\d+$/.test(url);
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
		if (isMobile()){
			removeFetchAndMonitorButtonFromPage();
			removeHomeButtonFromPage();
		}
		if (page.modal){
			hideGoTopButton();
			if (! isMobile() && avotter.settings.closeModalDialogByDoubleClick){
				installModalDialogHandler();
			}
		}
		else {
			if (page.type === "tweet"){
				if (avotter.settings.hidePromotion || avotter.settings.hideRecommendedUser)
					monitorTweet(true);
				if (avotter.settings.addFetchAndMonitorButton){
					addFetchAndMonitorButtonToPage();
					if (page.monitoring)
						fetchAndMonitorNewTweet(true);
				}
			}
			if (isMobile() && avotter.settings.addHomeButton)
				addHomeButtonToPage();
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
		let prev = currentPage(), modalDialogClosed;
		monitorTweet(false);
		let prev_monitoring = prev.monitoring;
		fetchAndMonitorNewTweet(false);
		prev.monitoring = prev_monitoring;
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
					if (prev.modal && avotter.page[i].type === "tweet")
						modalDialogClosed = true;
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
		if (modalDialogClosed){
			log("## modal on tweets closed");
			onTransitionComplete();
			return;
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
	
	function showGoTopButton()
	{
		let e = d.querySelector('.avtr-gotop-button');
		if (! e){
			e = d.createElement("div");
			e.innerHTML = '<svg viewBox="0 0 48 48" class="avtr-svg-gotop"><g><path d="M5.2292687594890594,21.073170736432076l18.341463431715965,-17.170731723308563l18.965853676199913,17.248780503869057l-2.341463416814804,2.2634146362543106l-14.907317087054253,-13.424390256404877l1.6390243917703629,33.873170763254166l-3.668292686343193,0l-1.404878050088879,-34.18536588549614l-14.048780500888828,13.346341475844383l-2.341463416814804,-2.185365855693817"/></g></svg>';
			e.className = "avtr-gotop-button";
			e.addEventListener("click",()=>scrollTo(0,0));
			document.body.appendChild(e);
		}
		e.style.display = "block";
	}

	function hideGoTopButton()
	{
		let e = d.querySelector('.avtr-gotop-button');
		if (e)
			e.style.display = "none";
	}
	
	function onScrollForGoTopButton()
	{
		if (! goTopTimer){
			if (pageYOffset > innerHeight)
				showGoTopButton();
			else
				hideGoTopButton();
			goTopTimer = setTimeout(()=>{goTopTimer=null}, 500);
		}
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
			screenName: "",
			pageTitle: "",
			page: [],
			hiddenPromotionCount: 0,
			settings: {
				hidePromotion: false,
				hideRecommendedUser: false,
				fitImageToArea: false,
				addFetchAndMonitorButton: false,
				fetchAfterStayFor: defaultFetchAfterStayFor,
				hideProfileAndPinnedTweetWhenMonitoring: false,
				showArrivalOfNewTweetsInTab: false,
				emojiForNotification: defaultEmojiForNotification.join(","),
				addHomeButton: false,
				addGoTopButton: false,
				closeModalDialogByDoubleClick: false,
				forceWorkingInBackground: false,
				storeSettingsInBrowser: false
			},
			// for debugging
			getTweetsContainer: getTweetsContainer,
			tweetsForEach: tweetsForEach,
			t2str: t2str,
			dispatchKeystroke: dispatchKeystroke,
			printTweets: printTweets
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
			+'.avtr-gotop-button{position:relative;width:2.2rem;height:2.2rem;background-color:gold;cursor:pointer;padding:3px 0 0 4px;border-radius:50%;position:fixed;bottom:1rem;left:1rem;z-index:3;}.avtr-svg-gotop{width:1.8rem}'
		);

		// add avotter settings button
		loadAvotterSettings();
		addAvotterButtonToPage();
		notifyInButton(avotter.hiddenPromotionCount);


		// moniter transition
		moniterObjectMethod(window.history, "pushState", onHistoryPushState);
		moniterObjectMethod(window.history, "replaceState", onHistoryReplaceState);
		window.addEventListener("popstate", onWindowPopstate);
		
		// moniter react-root
		let reactRoot = d.querySelector('#react-root');
		if (! reactRoot){
			avotter.fatalError = "#react-root " + translate("NotFound");
			return;
		}
		avotter.reactRootObserver = new MutationObserver(onReactRootChanged);
		
		
		avotter.pageIndex = avotter.page.push({
			type: getPageType(),
			state: window.history.state ? window.history.state : {},
			title: null, 
			url: location.pathname+location.search
		}) - 1;
		let page = currentPage();
		if (containsModalHeader(d))
			page.modal = true;
		
		// moniter nav icons to detect notification
		installNotificationWatcher();
		
		//
		hookVisibilityState();
		
		if (avotter.settings.addGoTopButton)
			window.addEventListener("scroll", onScrollForGoTopButton);
		
		avotter.debug = true;
		
		if (page.modal || page.type)
			onTransitionComplete();
	}
	
	if (!/^(mobile\.)?twitter\.com$/i.test(location.hostname)){
		alert(translate("this site is not twitter"));
		return;
	}
		
	if (! window["avotter"])
		init();
	if (avotter.fatalError){
		alert(avotter.fatalError);
		return;
	}
	
	let page = currentPage();
	if (! (page.modal || page.type)){
		if (containsModalHeader(d))
			page.modal = true;
		page.type = getPageType();
		if (page.modal || page.type)
			onTransitionComplete();
	}
})();
