/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/
/** ** ** ** ** ** ** Init  ** ** ** ** ** ** ** **/
/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/

/* * * * * * * * * * * * * * * * * * * */
/* * * Events, fixes, global stuff * * */
/* * * * * * * * * * * * * * * * * * * */

//Remove all toasts on pagechange event
$(document).delegate(document, "pagebeforechange", function( e, data ) {
	//if ($('.toast-container').length!=0) $('#popup').dialog('close');
});

//Add fitted logos to all pages
$(document).ready(function() {
	$('[data-role="page"]').each(function() {$(this).prepend('<img class="logo" src="img/logo.png" style="max-width:'+$(window).width()+"px"+';">')});
	//$('center').append('<div data-role="page" id="popup" data-theme="a" data-title="Popup"><img class="logo" src="img/logo.png" style="max-width:'+$(window).width()+"px"+';"></div>');
});

//Event to create Cover Slide
$(document).delegate('#slide', 'pagecreate',function(event) {
	makeSlide();
});

//Event to create Folder Structure
$(document).delegate('#chooser', 'pagecreate',function(event) {
	makeFolderStructure();
});

//Some fixes for nested folders in Folder Structure
$(document).delegate(':jqmData(url^=chooser)', 'pagebeforecreate', function(event) { 
	$(this).filter(':jqmData(url*=ui-page)').prepend('<img class="logo" src="img/logo.png" style="max-width:'+$(window).width()+"px"+';">');
	$(this).filter(':jqmData(url*=ui-page)').append('<div class="ui-bar ui-bar-a"><a href="javascript:$.mobile.silentScroll();" data-icon="arrow-u" data-iconpos="notext">Top</a><br><h4>xK3y Remote Web Interface</h4></div>');
	$(this).filter(':jqmData(url*=ui-page)').find(':jqmData(role=header)').prepend('<a href="#menu" data-direction="reverse" data-icon="home">Home</a>') 
}); 

//Event to create About
$(document).delegate('#about', 'pagecreate',function(event) {
	makeAbout();
});

//Event to create Game List
$(document).delegate('#alpha', 'pagecreate',function(event) {
	makeListTab();
});

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * Data parsing  * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Some global variables needed
var data;
var saveData;

//Main function, grabs all data from xk3y and parses it
function getData() {
	$.ajax({
		type: "GET",
		url: "data.xml",
		dataType: "xml",
		cache: false,
		success: function(xml) {
			var dirs = [];
			var ISOlist = [];
			var drives = [];
			var about = [];
			var cache = [];
			var iso;
			var id;
			var par;
			var dir;
			var coversrc;
			var isodata;
			var cacheImage;
			//Array of HDDs
			$(xml).find('MOUNT').each(function() {
				drives.push($(this).attr('NAME'));
			});
			//Parse ISO data
			$(xml).find('ISO').each(function() {
				iso = $(this).find('TITLE').text().replace(/\.iso/gi,"");
				id = $(this).find('ID').text();
				par = $(this.parentNode).attr('NAME');
				coversrc = "covers/"+id+".jpg";
				isodata = { 
						"layer" : "<a href=\"javascript:prepGame('"+id+"\','"+escape(iso)+"')\"><span><span>Play "+iso+"</span></span></a>", 
						"id" : id, 
						"name" : iso, 
						"image" : coversrc, 
						"title" : "FullScreen", 
						"par" : par };
				ISOlist.push(isodata);
				//Cache images
				cacheImage = new Image();
				cacheImage.src = "covers/"+id+".jpg";
				cache.push(cacheImage);
			});
			//Directories
			$(xml).find('DIR').each(function() {
				dir = $(this).attr('NAME');
				par = $(this.parentNode).attr('NAME');
				dirs.push({"dir" : dir, "par" : par});
			});
			//About info
			$(xml).find('ABOUT').find('ITEM').each(function() {
				about.push({item: $(this).attr('NAME'), value: $(this).text()});
			});
			//Put everything into the data JSON object
			data = { 
				"dirs" : dirs, 
				"ISOlist" : ISOlist, 
				"drives" : drives, 
				"about" : about 
			};
			//Serverside storage
			$.ajax({
				type: "GET",
				url: "store.sh",
				dataType: "json",
				cache: false,
				success: function(response) {
					if (response == null || response == "") {
						//Nothing saved yet? Make a new empty object
						saveData={};
					}
					else {
						//Else use the saved stats
						saveData=response;
					}
					//Experimental pre-loading of the probably most used menus
					$.mobile.loadPage('#alpha');
					$.mobile.loadPage('#chooser');
				},
				error: function() {
					//Error? Probably old firmware, show error popup
					$().toastmessage('showToast', {
						text: 'Error loading server storage, old firmware?',
						type: "error",
						sticky: false,
						close: function(){}
					});
					$('.toast-container').css('margin-left','-'+$('.toast-container').width()/2+'px');
					//Still make a new empty object, so we can still use it this session
					saveData={};
					//Experimental pre-loading of the probably most used menus
					$.mobile.loadPage('#alpha');
					$.mobile.loadPage('#chooser');
				}
			});
		}
	});
}

/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/
/** ** ** ** ** ** Menus Creation ** ** ** ** ** **/
/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * * Cover Slide * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Make the Cover Slide
function makeSlide() {
	var wwidth = $(window).width()-30;
	var wheight = $(window).height();
	$('#slidepage').html('<div id="slidepanel" style="width:100%;text-align:center"></div>');
	$('#slidepanel').galleria({
		width: wwidth,
		height: wheight,
		dataSource: data.ISOlist
	});
	//Add the jQuery Mobile classes to the layer
	Galleria.ready(function(options) {
		this.bind('loadfinish', function(e) {
			$('.galleria-layer a').addClass('ui-btn ui-btn-up-c ui-btn-corner-all ui-shadow');
			$('.galleria-layer > a > span').addClass('ui-btn-inner ui-btn-corner-all');
			$('.galleria-layer > a > span > span').addClass('ui-btn-text');
		});
	});
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * Folder Structure  * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Create the folder Structure
function makeFolderStructure() {
	$("#content").html("");
	$('<ul id="contentlist" data-role="listview" data-inset="true">').appendTo("#content");
	var dir;
	var par;
	var par1;
	var chk;
	var id;
	var name;
	var cover;
	var chk;
	var stored;
	var dataChange=false;
	var timesPlayed;
	//Create directories first
	for (var i=0; i<data.dirs.length; i++) {
		dir = escape(data.dirs[i].dir);
		par = data.dirs[i].par;
		chk = data.drives.toString().indexOf(par);
		//What if the parent directory is a HDD? Make it the content block
		if (chk!=-1) par1 = "contentlist";
		else {
			par1 = par+"-nest";
			par1 = escape(par1);
			if ($('ul#'+par1).length==0) $('<ul id="'+par1+'" data-inset="true">').appendTo(document.getElementById(par));
		}
		if ($('li#'+dir).length==0) $('<li id="'+dir+'">').html('<h3>'+unescape(dir)+'</h3><p>Folder</p><img src="img/folder.png"/>').appendTo(document.getElementById(par1));
	}
	//Then the ISOs
	for (var i=0; i<data.ISOlist.length; i++) {
		id = data.ISOlist[i].id;
		name = data.ISOlist[i].name;
		par = escape(data.ISOlist[i].par);
		cover = data.ISOlist[i].image;
		chk = data.drives.toString().indexOf(par);
		stored = saveData[id];
		//Cookie info, will be replaces with server stored info later on
		if (stored == null) {
			saveData[id] = {"timesPlayed": 0, "lastPlayed": 0};
			timesPlayed = 0;
			dataChange=true;
		}
		else timesPlayed = stored.timesPlayed;
		//Same parent fix as with directories
		if (chk!=-1) par1 = "contentlist";
		else {
			par1 = par+"-nest";
			par1 = escape(par1);
			if ($('ul#'+par1).length==0) $('<ul id="'+par1+'" data-inset="true">').appendTo(document.getElementById(par));
		}
		$('<li id="'+name+'">').html('<a href="#" onclick="prepGame(\''+id+'\',\''+escape(name)+'\')"><img src="'+cover+'"/><h3>'+name+'</h3><p>Played <span class="timesPlayed" id="'+id+'">'+timesPlayed+(timesPlayed == 1 ? " time" : " times")+'</span></p></a>').appendTo(document.getElementById(par1));
	};
	//Prepend the ... 'folders' that go up a directory
	$('ul[id$="-nest"]').each(function() {
		$(this).prepend('<li id="upone"><a data-rel="back"><img src="img/upone.png"/><h3>...</h3></a></li>');
	});
	//Magic!
	$('#contentlist').listview();
	
	if (dataChange) {
		$.post('store.sh',JSON.stringify(saveData));
	}
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * * Game List * * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Make the Alphabetic Game List
function makeListTab() {
	//Copy the ISOList! We don't want to mess up the other menus
	var ISOlist = data.ISOlist.slice();
	//Make it alpabetically listed
	ISOlist.sort(function(x,y) { 
		var a = String(x.name).toUpperCase(); 
		var b = String(y.name).toUpperCase(); 
		if (a > b) 
			return 1 
		if (a < b) 
			return -1 
		return 0; 
	}); 
	var iso;
	var id;
	var cover;
	var letter;
	var stored;
	var dataChange=false;
	var timesPlayed;
	var HTML='';
	//Add all the games to the list
	for (var i=0;i<=ISOlist.length-1;i++) {
		iso = ISOlist[i].name;
		id = ISOlist[i].id;
		cover = ISOlist[i].image;
		letter = iso.charAt(0).toUpperCase();
		stored = saveData[id];
		timesPlayed;
		if (stored == null) {
			saveData[id] = {"timesPlayed": 0, "lastPlayed": 0};
			timesPlayed = 0;
			dataChange=true;
		}
		else timesPlayed = stored.timesPlayed;
		if (HTML.indexOf(letter+'-divider')==-1) {
			HTML+='<li id="'+letter+'-divider" data-role="list-divider"><h3>'+letter+'</h3>';
			//$('<li id="'+letter+'-divider" data-role="list-divider">').html('<h3>'+letter+'</h3>').appendTo("#isolist");
		}
		HTML+='<li id="'+iso+'"><a href="#" onclick="prepGame(\''+id+'\',\''+escape(iso)+'\')"><img id="cover" src="'+cover+'"/><h3>'+iso+'</h3><p>Played <span class="timesPlayed" id="'+id+'">'+timesPlayed+(timesPlayed == 1 ? " time" : " times")+'</span></p></a>';
		//$('<li id="'+iso+'">').html('<a href="#" onclick="prepGame(\''+id+'\',\''+escape(iso)+'\')"><img id="cover" src="'+cover+'"/><h3>'+iso+'</h3><p>Played <span class="timesPlayed" id="'+id+'">'+timesPlayed+(timesPlayed == 1 ? " time" : " times")+'</span></p></a>').appendTo("#isolist");
	}
	//Native approach should be faster
	document.getElementById('isolist').innerHTML=HTML;
	//Magic!
	$("#isolist").listview();
	
	if (dataChange) {
		$.post('store.sh',JSON.stringify(saveData));
	}
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * * Most Played * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Create the Most Played list
function makeMostPlayedTab() {
	//We can't know from what tab we came, so we always pause the EasyDate plugin
	$.easydate.pause();
	//Copy the ISOList! We don't want to mess up the other menus
	var ISOlist = data.ISOlist.slice();
	//To speed switching between tabs up, we hide the alphabetic list and show a short "special" list
	//Because the special lists can change in one use, we always recreate those, but only load the alphabetic list once
	$('#speclister').show();
	$('#lister').hide();
	$("#speclister").html('<ul id="speclist" data-role="listview" data-filter="true" data-inset="true"></ul>');
	//$('<li data-role="list-divider">').html('<h3>Most Played</h3>').appendTo("#speclist");
	//Sort it with how many times it's been selected (to be replaced with server stored info later)
	ISOlist.sort(function(x,y) { 
		var JSONx = saveData[x.id];
		var timesPlayedx = JSONx.timesPlayed;
		var JSONy = saveData[y.id];
		var timesPlayedy = JSONy.timesPlayed;
		return timesPlayedy - timesPlayedx;
	});
	//We only want the first 5
	ISOlist.splice(5, ISOlist.length-5);
	var iso;
	var id;
	var covers;
	var stored;
	var dataChange=false;
	var timesPlayed;
	var HTML='<li data-role="list-divider"><h3>Most Played</h3></li>';
	//Add all the games to the list
	for (var i=0;i<=ISOlist.length-1;i++) {
		iso = ISOlist[i].name;
		id = ISOlist[i].id;
		cover = ISOlist[i].image;
		stored = saveData[id];
		timesPlayed = stored.timesPlayed;
		if (timesPlayed == null || timesPlayed==0) {
			saveData[id] = {"timesPlayed": 0, "lastPlayed": 0};
			dataChange=true;
			//Never played D: Get the hell out!
			break;
		}
		HTML+='<li id="'+iso+'"><a href="#" onclick=\'prepGame(\"'+id+'\",\"'+escape(iso)+'\")\'><img id="cover" src="'+cover+'"/><h3>'+iso+'</h3><p>Played <span class="timesPlayed" id="'+id+'">'+timesPlayed+(timesPlayed == 1 ? " time" : " times")+'</span></p></a></li>';
		//$('<li id="'+iso+'">').html('<a href="#" onclick=\'prepGame(\"'+id+'\",\"'+escape(iso)+'\")\'><img id="cover" src="'+cover+'"/><h3>'+iso+'</h3><p>Played <span class="timesPlayed" id="'+id+'">'+timesPlayed+(timesPlayed == 1 ? " time" : " times")+'</span></p></a>').appendTo("#speclist");
	}
	//Native approach should be faster
	document.getElementById('speclist').innerHTML=HTML;
	//What if we don't have any games?
	if ($('#speclist>li').length == 1) $('<li>').html('<h3>You haven\'t selected any games from this device yet!</h3><p></p>').appendTo("#speclist");	
	//Magic!
	$("#speclist").listview();
	//IE makes the bar disappear sometimes, remove and add it back!
	$('#IEFix').removeClass('ui-header ui-bar-a');
	$('#IEFix').addClass('ui-header ui-bar-a');
	
	if (dataChange) {
		$.post('store.sh',JSON.stringify(saveData));
	}
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * Recent Played * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Create the Recent list
function makeRecentTab() {
	//Copy the ISOList! We don't want to mess up the other menus
	var ISOlist = data.ISOlist.slice();
	//To speed switching between tabs up, we hide the alphabetic list and show a short "special" list
	//Because the special lists can change in one use, we always recreate those, but only load the alphabetic list once
	$('#speclister').show();
	$('#lister').hide();
	$("#speclister").html('<ul id="speclist" data-role="listview" data-filter="true" data-inset="true"></ul>');
	//$('<li data-role="list-divider">').html('<h3>Recently Played</h3>').appendTo("#speclist");
	//Sort it, will be replaced with server stored info later
	ISOlist.sort(function(x,y) { 
		var JSONx = saveData[x.id];
		var lastPlayedx = JSONx.lastPlayed;
		var JSONy = saveData[y.id];
		var lastPlayedy = JSONy.lastPlayed;
		return lastPlayedy - lastPlayedx;
	});
	//We only want 5
	ISOlist.splice(5, ISOlist.length-5);
	var iso;
	var id;
	var cover;
	var stored;
	var lastPlayed;
	var dataChange=false;
	var HTML='<li data-role="list-divider"><h3>Recently Played</h3></li>';
	for (var i=0;i<ISOlist.length;i++) {
		iso = ISOlist[i].name;
		id = ISOlist[i].id;
		cover = ISOlist[i].image;
		stored = saveData[id];
		lastPlayed = stored.lastPlayed;
		if (lastPlayed == null || lastPlayed==0) {
			saveData[id] = {"timesPlayed": 0, "lastPlayed": 0};
			dataChange=true;
			//Never played D: Get the hell out!
			break;
		}
		HTML+='<li id="'+iso+'"><a href="#" onclick=\'prepGame(\"'+id+'\",\"'+escape(iso)+'\")\'><img id="cover" src="'+cover+'"/><h3>'+iso+'</h3><p>Last played <span class="easydate" id="'+id+'">'+new Date(lastPlayed)+'</span></p></a></li>';
		//$('<li id="'+iso+'">').html('<a href="#" onclick=\'prepGame(\"'+id+'\",\"'+escape(iso)+'\")\'><img id="cover" src="'+cover+'"/><h3>'+iso+'</h3><p>Last played <span class="easydate" id="'+id+'">'+new Date(lastPlayed)+'</span></p></a>').appendTo("#speclist");
	}
	//Native approach should be faster
	document.getElementById('speclist').innerHTML=HTML;
	//Date magic!
	$(".easydate").easydate(); 
			
	if ($('#speclist>li').length == 1) $('<li>').html('<h3>You haven\'t selected any games from this device yet!</h3><p></p>').appendTo("#speclist");
	//Magic!
	$("#speclist").listview();
	//IE makes the bar disappear sometimes, remove and add it back!
	$('#IEFix').removeClass('ui-header ui-bar-a');
	$('#IEFix').addClass('ui-header ui-bar-a');
	//If saveData changed, store to server
	if (dataChange) {
		$.post('store.sh',JSON.stringify(saveData));
	}
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * * * About * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Create the About screen
function makeAbout() {
	//Current Web Interface version, update it!
	var version = "1.09";
	//Long HTML ftw
	$("#info").html('<ul data-role="listview" data-inset="true"><li>Web Interface version '+version+'</li><li>Interface created using jQuery Mobile</li><li>Cover Slide created using Galleria</li><li>Interface made by Mr_Waffle</li></ul><a id="resetStatsButton" href="#" onclick="resetStats()" data-inline="true" data-role="button">Reset Game Stats</a>');
	$('<ul id="infolist" data-role="listview" data-inset="true">').prependTo("#info");
	//All the info items from the xK3y
	for (var i=0; i<data.about.length; i++) {
		$('<li>').html(data.about[i].item+' : '+data.about[i].value).appendTo("#infolist");
	}
	$('<li>').html('Connected Devices : '+data.drives).appendTo("#infolist");
	//Magic!
	$('#infolist').listview();
}

/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/
/** ** ** ** ** ** Game Selection ** ** ** ** ** **/
/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * * Game Info * * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//The new game info system/design, still needs moar work
//Messy as hell
function gameInfo(id, name) {
	var url = 'covers/'+id+'.xml';
	//Haxxed dialog
	showBackground();
	$.ajax({
		type: "GET",
		url: url,
		dataType: "xml",
		cache: false,
		success: function(xml) {
			//If there's no info popup yet, let's make one!
			if ($('#infoblock').length==0) {
				$().toastmessage('showNormalToast', '<div id="infoblock" class="ui-grid-a"><div id="infoblock1" class="ui-block-a"></div><div id="infoblock2" class="ui-block-b"></div></div>');
				$('.toast-container').css('margin-left','-'+$('.toast-container').width()/2+'px');
				$('.toast-container').css('top',$('.logo')[0].height+'px');
			}
			//Prepare fav button HTML
			var favButton;
			var favTest = findList(id);
			//Game in not a single favlist? Give an Add button
			if (favTest.length == 0) favButton = '<a onclick="addFavPopup(\''+id+'\',\''+name+'\')" href="#" data-role="button">Add to favorites</a>';
			//Game in 1 or more favlists? Always show a "management" popup
			else favButton = '<a onclick="manageFavPopup(\''+id+'\',\''+name+'\')" href="#" data-role="button">Manage favorites</a>';
			//HTML for the left part
			var cover = '<img align="left" src="covers/'+id+'.jpg" style="width:'+($('#infoblock1').width()-10)+'px;"><br/>Tools<a onclick="launchGame(\''+id+'\')" href="#" data-role="button">Play Game</a>'+favButton+'<a onclick="$(\'#popup\').dialog(\'close\');$().toastmessage(\'removeToast\',$(\'.toast-item\'))" href="#" data-role="button">Close</a>'
			//Apply HTML
			$('#infoblock1').html(cover);
			//Prepare title HTML
			var title;
			//We have a default game.xml? Use the ISO name
			if ($(xml).find('title').text()=="No Title") title = unescape(name);
			//Otherwise use the title from the game.xml
			else title = $(xml).find('title').text();
			//Preparing HTML for the right part
			var info = '<div style="padding:5px;"><big><big><big>'+title+'</big></big></big><br/><br/><div id="infoItems"></div><br/>'+$(xml).find('summary').text()+'<br/></div>';
			//Apply HTML
			$('#infoblock2').html(info);
			//Additional info items
			var infoitems="";
			$(xml).find('infoitem').each(function() {
				//Add them all to a long HTML string
				infoitems+=$(this).text()+'<br/>';
			});
			//Apply HTML
			$('#infoItems').html(infoitems);
			//JQM magic
			$('#infoblock').trigger('create');
		},
		error: function(xml) {
			//No game.xml? Still create info popup, just with default game.xml contents
			if ($('#infoblock').length==0) {
				$().toastmessage('showNormalToast', '<div id="infoblock" class="ui-grid-a"><div id="infoblock1" class="ui-block-a"></div><div id="infoblock2" class="ui-block-b"></div></div>');
				$('.toast-container').css('margin-left','-'+$('.toast-container').width()/2+'px');
				$('.toast-container').css('top',$('.logo')[0].height+20+'px');
			}
			//Same stuff as above
			var favButton;
			var favTest = findList(id);
			if (favTest.length == 0) favButton = '<a onclick="addFavPopup(\''+id+'\',\''+name+'\')" href="#" data-role="button">Add to favorites</a>';
			else favButton = '<a onclick="manageFavPopup(\''+id+'\',\''+name+'\')" href="#" data-role="button">Manage favorites</a>';
			var cover = '<img align="left" src="covers/'+id+'.jpg" style="width:'+($('#infoblock1').width()-10)+'px;"><br/>Tools<a onclick="launchGame(\''+id+'\')" href="#" data-role="button">Play Game</a>'+favButton+'<a onclick="$(\'#popup\').dialog(\'close\');$().toastmessage(\'removeToast\',$(\'.toast-item\'))" href="#" data-role="button">Close</a>'
			$('#infoblock1').html(cover);
			var title = unescape(name);
			var info = '<div style="padding:5px;"><big><big><big>'+title+'</big></big></big><br/><br/><div id="infoItems"></div><br/>No Summary<br/></div>';
			$('#infoblock2').html(info);
			var infoitems="No Additional Info";
			$('#infoItems').html(infoitems);
			$('#infoblock').trigger('create');
		}
	});
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * Prepare Games * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Game chosen? Sweet! We need to do some stuff first though...
function prepGame(id, name) {
	//Delete any toasts there are right now
	//if ($('.toast-container')) $().toastmessage('removeToast',$('.toast-item'));
	//Show the game info from appropriate XML file
	gameInfo(id, name);
	//There's a bug with the iPad if we're fullscreen in Cover Slide, kick it out.
	//I don't know if there're other devices that have it, so we just always kick it out
	var CoverSlide = Galleria.get(0);
	if (CoverSlide) {
		if (CoverSlide.isFullscreen()) CoverSlide.exitFullscreen();
	}
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * * Launch Game * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Actually loads the game
function launchGame(id) {
	var url = "launchgame.sh?"+id;
	//Prep for the data update
	var stored = saveData[id];
	var timesPlayed = stored.timesPlayed;
	$.ajax({
		type: "GET",
		url: "data.xml",
		dataType: "xml",
		cache: false,
		success: function(xml) {
			var tray = $(xml).find('TRAYSTATE').text();
			var guistate = $(xml).find("GUISTATE").text();
			if (tray == 0) {
                $.get(url);
				//Update data on xk3y
				saveData[id] = {"timesPlayed": (timesPlayed+1), "lastPlayed": Date.parse(new Date)};
				$.post('store.sh',JSON.stringify(saveData));
				//Update the playtimes on the menus
				updatePlayTimes(id);
            } else {
                if (tray == 1 && guistate == 1) {
                    $().toastmessage('showNoticeToast', 'Please open your DVD tray.');
					scrollDown();
					$.get(url);
					//Update data on xk3y
					saveData[id] = {"timesPlayed": (timesPlayed+1), "lastPlayed": Date.parse(new Date)};
					$.post('store.sh',JSON.stringify(saveData));
					//Update the playtimes on the menus
					updatePlayTimes(id);
                } else {
                    if (tray == 1 && guistate == 2) {
                        $().toastmessage('showNoticeToast', 'A game appears to be already loaded, please open your DVD tray and click "Play Game" again.');
						scrollDown();
                    }
                }
			}
		}
	});
   //Experimental error system, still needs work
   //var t=setTimeout("getErrors()", 3000);
}

/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/
/** ** ** ** ** FavList functions ** ** ** ** ** **/
/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * Favorites Tab * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Create the fav lists tab
function makeFavListsTab() {
	//Copy the ISOList! We don't want to mess up the other menus
	var ISOlist = data.ISOlist.slice();
	
	//To speed switching between tabs up, we hide the alphabetic list and show a short "special" list
	//Because the special lists can change in one use, we always recreate those, but only load the alphabetic list once
	$('#speclister').show();
	$('#lister').hide();
	$("#speclister").html('<ul id="speclist" data-role="listview" data-inset="true"></ul>');
	$('<li data-role="list-divider">').html('<h3>Favorites</h3>').appendTo("#speclist");
	
	var savedFavLists = saveData['FavLists'];
	var tabHTML='';
	if (savedFavLists == null) {
		$('<li>').html('<h3>No favorite lists found! Click Management to create one!</h3>').appendTo('#speclist');
		tabHTML='<a onclick="manageFavPopup();showBackground()" href="#" data-role="button" data-icon="gear">Management</a>'
	}
	else {
		var favLists = [];
		for (var i in savedFavLists) {
			favLists.push(i);
		}
		var favListsHTML='';
		for (var i=0;i<favLists.length;i++) {
			favListsHTML+='<option value="'+favLists[i]+'">'+unescape(favLists[i])+'</option>';
		}
		tabHTML='<label for="favListSelector">Select a list!</label></h3><select name="favListSelector" id="favListSelector" data-theme="a" data-icon="arrow-d" onchange="getFavList(this.value)">'+favListsHTML+'</select><a onclick="manageFavPopup();showBackground()" href="#" data-role="button" data-icon="gear">Management</a>';
	}
	$('<div id="favTabOptions" class="ui-hide-label">').html(tabHTML).prependTo("#speclister");
	//Magic!
	$("#speclist").listview();
	$("#speclister").trigger('create');
	//IE makes the bar disappear sometimes, remove and add it back!
	$('#IEFix').removeClass('ui-header ui-bar-a');
	$('#IEFix').addClass('ui-header ui-bar-a');
	if (savedFavLists!=null) {
		getFavList(favLists[0]);
	}
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * List favlist games  * * * * */
/* * * * * * * * * * * * * * * * * * * */

function getFavList(listName) {
	var savedFavLists = saveData['FavLists'];
	var games = savedFavLists[listName];
	var iso;
	var id;
	var cover;
	var stored;
	var dataChange=false;
	var timesPlayed;
	var HTML='<li data-role="list-divider"><h3>Favorites</h3></li>';
	for (var i=0;i<games.length;i++) {
		iso = games[i].name;
		id = games[i].id;
		if (id=='0000000000000000000000000000000000000000') continue;
		cover = 'covers/'+games[i].id+'.jpg';
		stored = saveData[games[i].id];
		if (stored == null) {
			saveData[id] = {"timesPlayed": 0, "lastPlayed": 0};
			timesPlayed = 0;
			dataChange=true;
		}
		else {
			timesPlayed = stored.timesPlayed;
		}
		HTML+='<li id="'+iso+'"><a href="#" onclick="prepGame(\''+id+'\',\''+iso+'\')"><img id="cover" src="'+cover+'"/><h3>'+unescape(iso)+'</h3><p>Played <span class="timesPlayed" id="'+id+'">'+timesPlayed+(timesPlayed == 1 ? " time" : " times")+'</span></p></a></li>';
	}
	//Native approach should be faster
	document.getElementById('speclist').innerHTML=HTML;
	if ($('#speclist>li').length == 1) $('<li>').html('<h3>This favorite list is empty!</h3><p></p>').appendTo("#speclist");	
	//Magic!
	//$("#speclister").trigger('create');
	$("#speclist").listview('refresh');
	
	if (dataChange) {
		$.post('store.sh',JSON.stringify(saveData));
	}
	
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * Add Fav Popup * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Fav popup
function addFavPopup(id, name) {
	//Get all current list data
	var savedFavLists = saveData['FavLists'];
	//If there are no lists made yet, create a popup asking for the first list EVAR
	if (savedFavLists == null && $('#createFavList').length==0) {
		noFavLists(id, name);
		return;
	}
	//if (typeof(savedFavLists)!='object') savedFavLists=JSON.parse(savedFavLists);
	//Otherwise, parse the lists
	//Get ALL the list names!
	var favLists = [];
	for (var i in savedFavLists) {
		favLists.push(i);
	}
	//Create ALL the list options!
	var favListsHTML="";
	for (var i=0;i<favLists.length;i++) {
		favListsHTML+='<option value="'+favLists[i]+'">'+unescape(favLists[i])+'</option>';
	}
	//If there's no popup yet, create one! Otherwise don't bother, there's already one ;)
	if ($('#favListDropDown').length==0) {
		$().toastmessage('showNormalToast', '<div class="favListAddToast"><label for="favListDropDown" class="select">Select a list to add this game to:</label><select name="favListDropDown" id="favListDropDown" data-theme="a" data-icon="star" data-inline="true">'+favListsHTML+'</select><a href="#" onclick="addFav(\''+id+'\',\''+name+'\',true)" data-role="button" data-inline="true" data-icon="check">Confirm</a><a href="#" onclick="$().toastmessage(\'removeToast\',$(\'.toast-item:last\'))" data-role="button" data-inline="true" data-icon="delete">Cancel</a></div>');
		scrollDown();
		//JQM magic
		$('.favListAddToast').trigger('create');
	}
	else return;
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * Manage Favs Popup * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Management popup
//Universal
function manageFavPopup(id, name) {
	$('.toast-container').css('top',$('.logo')[0].height+'px');
	//Get all current list data
	var savedFavLists = saveData['FavLists'];
	//If there are no lists made yet, create a popup asking for the first list EVAR
	if (savedFavLists == null && $('#createFavList').length==0) {
		if (id) noFavLists(id, name);
		else noFavLists(null, null, true);
		return;
	}
	//If there's no management popup yet, create one
	if ($('.favListManagementToast').length==0) {
		var closeAction;
		if (id) {
			closeAction = function(){$().toastmessage('removeToast',$('.toast-item:last'))};
		}
		else {
			closeAction = function(){makeFavListsTab();$('#popup').dialog('close');$().toastmessage('removeToast',$('.toast-item'))};
		}
		$().toastmessage('showToast', {
						text: '<div class="favListManagementToast"></div>',
						type: "normal",
						close: closeAction
		});
		scrollDown();
	}
	else {
	
	}
	//if (typeof(savedFavLists)!='object') savedFavLists=JSON.parse(savedFavLists);
	//Otherwise, parse the lists
	//Get ALL the list names!
	var favLists = [];
	for (var i in savedFavLists) {
		favLists.push(i);
	}
	//Create ALL the list options!
	var favListsHTML="";
	for (var i=0;i<favLists.length;i++) {
		//If from info popup
		if (id) {
			//If the ID is found in a list, don't add that list to the HTML
			if (findList(id).toString().indexOf(favLists[i])!=-1) {
				continue;
			}
		}
		favListsHTML+='<option value="'+favLists[i]+'">'+unescape(favLists[i])+'</option>';
	}
	//console.log(favListsHTML);
	//Preparing popup HTML
	var managementHTML = '';
	var createList='';
	//Add from info HTML
	if (id) {
		createList='createFavList(\''+id+'\',\''+name+'\')';
		//Remove from list HTML
		var removeListsHTML="";
		var removeLists = findList(id);
		for (var i=0;i<removeLists.length;i++) {
			removeListsHTML+='<option value="'+removeLists[i]+'">'+unescape(removeLists[i])+'</option>';
		}
		//console.log(removeListsHTML);
		if (removeListsHTML.length > 1) {
			managementHTML+='<label for="favListRemoveDropDown" class="select">Select a list to remove this game from:</label><select name="favListRemoveDropDown" id="favListRemoveDropDown" data-theme="a" data-icon="arrow-d" data-inline="true">'+removeListsHTML+'</select><a href="#" onclick="removeFav(\''+id+'\', \''+name+'\')" data-role="button" data-inline="true">Remove from list</a><hr/>';
		}
		//Add to list HTML
		if (favListsHTML.length > 1) {
			managementHTML+='<label for="favListDropDown" class="select">Select a list to add this game to:</label><select name="favListDropDown" id="favListDropDown" data-theme="a" data-icon="arrow-d" data-inline="true">'+favListsHTML+'</select><a href="#" onclick="addFav(\''+id+'\',\''+name+'\')" data-role="button" data-inline="true">Add to list</a><hr/>';
		}
	}
	else {
		createList='createFavList(null,null,true)';
		//From favlist only options
		managementHTML+='<label for="ListRemoveDropDown" class="select">Select a list to remove:</label><select name="ListRemoveDropDown" id="ListRemoveDropDown" data-theme="a" data-icon="arrow-d" data-inline="true">'+favListsHTML+'</select><a href="#" onclick="removeFavList()" data-role="button" data-inline="true">Remove list</a><hr/>';
	}
	//Some general HTML here
	//New list HTML
	managementHTML+='<label for="favListName">Create a new list:</label><center><input id="favListName" style="max-width:200px" value="List Name" type="text"/></center><a onclick="'+createList+'" href="#" data-role="button" data-inline="true">Create List</a><hr/>';
	//Close button
	if (id) {
		managementHTML+='<a onclick="$().toastmessage(\'removeToast\',$(\'.toast-item:last\'))" href="#" data-role="button" data-inline="true">Close</a>';
	}
	else {
		managementHTML+='<a onclick="makeFavListsTab();$(\'#popup\').dialog(\'close\');$().toastmessage(\'removeToast\',$(\'.toast-item\'))" href="#" data-role="button" data-inline="true">Close</a>';
	}
	//End this madness
	$('.favListManagementToast').html(managementHTML);
	//JQM magic
	$('.favListManagementToast').trigger('create');
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * Create Fav List * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Create a new list, optional id and name argument to populate list on creation
function createFavList(id, name, tabbed) {
	//console.log(id);
	//console.log(name);
	//Create a new list, currently only possible through the popup, so we always get the value from there
	var listName = escape($('#favListName')[0].value);
	//Get the currently saved lists
	var favLists = saveData['FavLists'];
	//No lists? New object
	if (favLists == null) {
		favLists={};
	}
	else {
		if (listName in favLists) {
		$().toastmessage('showToast', {
						text: 'List "'+unescape(listName)+'" already exists!',
						type: "error",
						sticky: false,
						close : function(){}
		});
		scrollDown();
		return;
		}
	}
	var gameList = [];
	//An ID is given as argument? Populate list with ID and name
	if (id) {
		gameList[0]={
					"id" : id,
					"name" : name };
	}
	//Otherwise use dummy data
	else {
		gameList[0]={
					"id" : "0000000000000000000000000000000000000000",
					"name" : "This list is empty!" };
	}
	//Save gameList array to the listName key in the favLists object
	//Complicated, I know
	favLists[listName]=gameList;
	//Stringify that thing and save it
	saveData['FavLists'] = favLists;
	if (tabbed==true) {
		manageFavPopup();
	}
	else if (tabbed==false) {
		gameInfo(id, name);
		$().toastmessage('removeToast',$('.toast-item:last'));
	}
	else {
		gameInfo(id, name);
		manageFavPopup(id, name);
	}
	$.post('store.sh', JSON.stringify(saveData));
	$().toastmessage('showToast', {
						text: 'Created list "'+unescape(listName)+'" successfully!',
						type: "notice",
						sticky: false,
						close : function(){}
	});
	scrollDown();
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * Remove Fav List * * * * * */
/* * * * * * * * * * * * * * * * * * * */

function removeFavList() { 
	var listName=$('#ListRemoveDropDown')[0].value;
	var favLists = saveData['FavLists'];
	var result = delete favLists[listName];
	var message;
	if (result) {
		message='List "'+unescape(listName)+'" successfully removed!';
	}
	else {
		message='Error removing list "'+unescape(listName)+'".';
	}
	$().toastmessage('showToast', {
						text: message,
						type: "notice",
						sticky: false,
						close : function(){}
	});
	scrollDown();
	saveData['FavLists'] = favLists;
	$.post('store.sh', JSON.stringify(saveData));
	manageFavPopup();
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * Add game to favlist * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Add game to selected list, takes no list argument because we only allow adding from the info screen
function addFav(id, name, init) {
	var listName = $('#favListDropDown')[0].value;
	//We already have a list, otherwise we wouldn't be able to get here, so no need to check for that
	var favLists = saveData['FavLists'];
	//Get the gameList array from the favLists object with the listName key
	var gameList = favLists[listName];
	//Dummy data present? Slice that thing off
	if (gameList[0].id=="0000000000000000000000000000000000000000") {
		gameList.splice(0,1);
	}
	//Push new game to array
	gameList.push({
					"id" : id,
					"name" : name });
	//Save again
	favLists[listName]=gameList;
	saveData['FavLists'] = favLists;
	$.post('store.sh', JSON.stringify(saveData));
	//Remove the last toast upon completion
	if (init) {
		$().toastmessage('removeToast',$('.toast-item:last'));
		gameInfo(id, name);
	}
	else {
		manageFavPopup(id, name);
	}
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * Remove game from list * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Remove a game from a list from either a dropdown menu or argument
function removeFav(id, name, favList) {
	var listName;
	//Specify favList
	if (favList) listName = favList;
	else listName = $('#favListRemoveDropDown')[0].value;
	var favLists = saveData['FavLists'];
	//if (typeof(favLists)!='object') favLists=JSON.parse(favLists);
	//Get the gameList array from the favLists object with the listName key
	var gameList = favLists[listName];
	//Find the index in the given array with the given ID
	var index = findIndex(gameList, id);
	//Slice it off
	gameList.splice(index,1);
	//If the new length == 0, fill with dummy data
	if (gameList.length==0) {
		gameList[0]={
					"id" : "0000000000000000000000000000000000000000",
					"name" : "This list is empty!" };
	}
	//Save
	favLists[listName]=gameList;
	saveData['FavLists'] = favLists;
	$.post('store.sh', JSON.stringify(saveData));
	manageFavPopup(id,name);
}

/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/
/** ** ** ** ** ** ** Other ** ** ** ** ** ** ** **/
/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/

/* * * * * * * * * * * * * * * * * * * */
/* * * * Update visual playtimes * * * */
/* * * * * * * * * * * * * * * * * * * */

//Update the menu play times
function updatePlayTimes(id) {
	//Specificly update a game
	if (id) {
		var data = $('span#'+id);
		var stored = saveData[id];
		var current = stored.timesPlayed;
		for (var i = 0; i<data.length; i++) {
			data[i].innerHTML = current + (current == 1 ? " time" : " times");
		}
	}
	//No ID specified? Clear all the games
	else {
		var data = $('.timesPlayed');
		for (var i = 0; i<data.length; i++) {
			data[i].innerHTML = "0 times";
		}
	}
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * * Reset Stats * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Reset stats from the About menu
function resetStats() {
	for (var i = 0; i<data.ISOlist.length; i++) {
		saveData[data.ISOlist[i].id]={"timesPlayed": 0, "lastPlayed": 0};
	}
	$('#resetStatsButton>span>span').html("Done!");
	var resetText = setTimeout("$('#resetStatsButton>span>span').html('Reset Game Stats')",3000);
	//Update the visual playtimes
	updatePlayTimes();
	//Save to server
	$.post('store.sh', JSON.stringify(saveData));
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * * No Fav List * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Predefined No Fav Lists message
function noFavLists(id, name, tabbed) {
	$('.toast-container').css('top',$('.logo')[0].height+'px');
	onClick='';
	if (tabbed) {
		onClick='$().toastmessage(\'removeToast\',$(\'.toast-item:last\'));createFavList(null,null,true);';
	}
	else {
		onClick='createFavList(\''+id+'\',\''+name+'\',false)';
	}
	$().toastmessage('showErrorToast', '<div id="createFavList">No favourite lists found! Please create one.<br/><center><input id="favListName" style="width:40%" value="List Name" type="text"/></center><a onclick="'+onClick+'" href="#" data-role="button" data-inline="true">Create List</a></div>');
	scrollDown();
	//JQM magic
	$('#createFavList').trigger('create');
	//We're done here
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * * Find List * * * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Function to find FavList by ID
//I'M A FRIGGIN GENIUS
function findList(id) {
	var savedFavLists = saveData['FavLists'];
	var foundLists = [];
	for (var i in savedFavLists) {
		if (JSON.stringify(savedFavLists[i]).indexOf(id)!=-1) foundLists.push(i);
	}
	return foundLists;
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * * * Find list index * * * * * */
/* * * * * * * * * * * * * * * * * * * */

//Find the index of a game ID
//Again, genius :D
function findIndex(array, id) {
	for (var i=0; i<array.length; i++) {
		if (array[i].id==id) return i;
	}
	return -1;
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * Show empty JQM popup  * * * * */
/* * * * * * * * * * * * * * * * * * * */

function showBackground() {
	$('<a href="#popup" data-rel="dialog">').appendTo('body').click().remove();
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * Scroll to the bottom  * * * * */
/* * * * * * * * * * * * * * * * * * * */

function scrollDown() {
	$('html,body').animate({scrollTop: document.body.scrollHeight}, 1000, function() {$.mobile.silentScroll(document.body.scrollHeight)});
}

/* * * * * * * * * * * * * * * * * * * */
/* * * * Experimental features * * * * */
/* * * * * * * * * * * * * * * * * * * */
/*
//Experimental update from the web, currently only checks for updates, never actually called
function getLatest() {
	if ($.browser.msie) {
	var xdr = new XDomainRequest();
	xdr.onload = function() {
					var current = data.about[1].value;
					var latest = xdr.responseText;
					if (current < latest) $().toastmessage('showNoticeToast', 'A new firmware is available for download: '+latest);
					$('.toast-container').css('margin-left','-'+$('.toast-container').width()/2+'px');
				}
	xdr.open("get", 'http://devfaw.com/latest.php');
	xdr.send();
	}
	else {
		$.ajax({
			type: "GET",
			url: "http://devfaw.com/latest.php",
			cache: false,
			success: function(latest) {
				var current = data.about[1].value;
				if (current < latest) $().toastmessage('showNoticeToast', 'A new firmware is available for download: '+latest);
				$('.toast-container').css('margin-left','-'+$('.toast-container').width()/2+'px');
			}
		});
	}
}

//The error system from earlier, needs work
function getErrors() {
	$.ajax({
		type: "GET",
		url: "data.xml",
		dataType: "xml",
		cache: false,
		success: function(xml) {
			var error = parseInt($(xml).find('EMERGENCY').text());
			switch (error) {
				case 2:
					$().toastmessage('showErrorToast', 'Disc Read Error, reset your console!');
					break;
				default:
					break;
			}
		}
	});
}*/