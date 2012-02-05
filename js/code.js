//Remove all toasts on pagechange event
$(document).delegate(document, "pagebeforechange", function( e, data ) {
	if ($('.toast-container')) $().toastmessage('removeToast',$('.toast-type-normal'));
});

//Add fitted logos to all pages
$(document).ready(function() {
	$('[data-role="page"]').each(function() {$(this).prepend('<img id="logo" src="img/logo.png" style="max-width:'+$(window).width()+"px"+';">')});
});

//Event to create Cover Slide
$(document).delegate('#slide', 'pagecreate',function(event) {
	makeSlide();
});

//Event to create Folder Structure
$(document).delegate('#chooser', 'pagecreate',function(event) {
	getFolderStructure();
});

//Some fixes for nested folders in Folder Structure
$(document).delegate(':jqmData(url^=chooser)', 'pagebeforecreate', function(event) { 
	$(this).filter(':jqmData(url*=ui-page)').prepend('<img id="logo" src="img/logo.png" style="max-width:'+$(window).width()+"px"+';">');
	$(this).filter(':jqmData(url*=ui-page)').append('<div class="ui-bar ui-bar-a"><a href="javascript:$.mobile.silentScroll();" data-icon="arrow-u" data-iconpos="notext">Top</a><br><h4>xK3y Remote Web Interface</h4></div>');
	$(this).filter(':jqmData(url*=ui-page)').find(':jqmData(role=header)').prepend('<a href="#menu" data-direction="reverse" data-icon="home">Home</a>') 
}); 

//Event to create About
$(document).delegate('#about', 'pagecreate',function(event) {
	getAbout();
});

//Event to create Game List
$(document).delegate('#alpha', 'pagecreate',function(event) {
	getList();
});

//Some global variables needed
var data;
var scrollPosition;

//Main function, grabs all data from xk3y and parses it
function getData() {
	$.ajax({
		type: "GET",
		url: "data.xml",
		cache: false,
		dataType: "xml",
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
				//Cache images, untested
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
				"about" : about };
		}
	});
}

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

//Create the folder Structure
function getFolderStructure() {
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
	var JSON;
	var timesPlayed;
	//Create directories first
	for (var i=0; i<data.dirs.length; i++) {
		dir = data.dirs[i].dir;
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
		par = data.ISOlist[i].par;
		cover = data.ISOlist[i].image;
		chk = data.drives.toString().indexOf(par);
		JSON = eval('('+readCookie(id)+')');
		//Cookie info, will be replaces with server stored info later on
		if (JSON == null) {
			createCookie(id, '{timesPlayed: 0, lastPlayed: 0}');
			timesPlayed = 0;
		}
		else var timesPlayed = JSON.timesPlayed;
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
}

//Create the About screen
function getAbout() {
	//Current Web Interface version, update it!
	var version = "1.07";
	//Long HTML ftw
	$("#info").html('<ul data-role="listview" data-inset="true"><li>Web Interface version '+version+'</li><li>Interface created using jQuery Mobile</li><li>Cover Slide created using Galleria</li><li>Interface made by Mr_Waffle</li><li>Like this interface? Please consider supporting me! (I\'ve worked hard on it :D)</li><li><form data-role="none" action="https://www.paypal.com/cgi-bin/webscr" method="post"><input type="hidden" name="cmd" value="_s-xclick"><input type="hidden" name="hosted_button_id" value="N74W4ER6ANH7S"><input data-role="none" type="image" src="img/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!"><img alt="" border="0" src="https://www.paypalobjects.com/nl_NL/i/scr/pixel.gif" width="1" height="1"></form></li></ul><a id="resetStatsButton" href="#" onclick="resetStats()" data-inline="true" data-role="button">Reset Game Stats</a>');
	$('<ul id="infolist" data-role="listview" data-inset="true">').prependTo("#info");
	//All the info items from the xK3y
	for (var i=0; i<data.about.length; i++) {
		$('<li>').html(data.about[i].item+' : '+data.about[i].value).appendTo("#infolist");
	}
	$('<li>').html('Connected Devices : '+data.drives).appendTo("#infolist");
	//Magic!
	$('#infolist').listview();
}

//Make the Alphabetic Game List
function getList() {
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
	var JSON;
	var timesPlayed;
	//Add all the games to the list
	for (var i=0;i<=ISOlist.length-1;i++) {
		iso = ISOlist[i].name;
		id = ISOlist[i].id;
		cover = ISOlist[i].image;
		letter = iso.charAt(0).toUpperCase();
		JSON = eval('('+readCookie(id)+')');
		timesPlayed;
		if (JSON == null) {
			createCookie(id, '{timesPlayed: 0, lastPlayed: 0}');
			timesPlayed = 0;
		}
		else timesPlayed = JSON.timesPlayed;
		if ($('li#'+letter+'-divider').length==0) $('<li id="'+letter+'-divider" data-role="list-divider">').html('<h3>'+letter+'</h3>').appendTo("#isolist");
		$('<li id="'+iso+'">').html('<a href="#" onclick="prepGame(\''+id+'\',\''+escape(iso)+'\')"><img id="cover" src="'+cover+'"/><h3>'+iso+'</h3><p>Played <span class="timesPlayed" id="'+id+'">'+timesPlayed+(timesPlayed == 1 ? " time" : " times")+'</span></p></a>').appendTo("#isolist");
	}
	//Magic!
	$("#isolist").listview();
}

//Create the Most Played list
function getMostPlayed() {
	//We can't know from what tab we came, so we always pause the EasyDate plugin
	$.easydate.pause();
	//Copy the ISOList! We don't want to mess up the other menus
	var ISOlist = data.ISOlist.slice();
	//To speed switching between tabs up, we hide the alphabetic list and show a short "special" list
	//Because the special lists can change in one use, we always refresh those, but only load the alphabetic list once
	$('#speclister').show();
	$('#lister').hide();
	$("#speclister").html('<ul id="speclist" data-role="listview" data-filter="true" data-inset="true"></ul>');
	$('<li data-role="list-divider">').html('<h3>Most Played</h3>').appendTo("#speclist");
	//Sort it with how many times it's been selected (to be replaced with server stored info later)
	ISOlist.sort(function(x,y) { 
		var JSONx = eval('('+readCookie(x.id)+')');
		var timesPlayedx = JSONx.timesPlayed;
		var JSONy = eval('('+readCookie(y.id)+')');
		var timesPlayedy = JSONy.timesPlayed;
		return timesPlayedy - timesPlayedx;
	});
	//We only want the first 5
	ISOlist.splice(5, ISOlist.length-5);
	var iso;
	var id;
	var covers;
	var JSON;
	var timesPlayed;
	//Add all the games to the list
	for (var i=0;i<=ISOlist.length-1;i++) {
		iso = ISOlist[i].name;
		id = ISOlist[i].id;
		cover = ISOlist[i].image;
		JSON = eval('('+readCookie(id)+')');
		timesPlayed = JSON.timesPlayed;
		if (timesPlayed == null || timesPlayed==0) {
			createCookie(id, '{timesPlayed: 0, lastPlayed: 0}');
			//Never played D: Get the hell out!
			break;
		}
		$('<li id="'+iso+'">').html('<a href="#" onclick=\'prepGame(\"'+id+'\",\"'+escape(iso)+'\")\'><img id="cover" src="'+cover+'"/><h3>'+iso+'</h3><p>Played <span class="timesPlayed" id="'+id+'">'+timesPlayed+(timesPlayed == 1 ? " time" : " times")+'</span></p></a>').appendTo("#speclist");
	}
	//What if we don't have any games?
	if ($('#speclist>li').length == 1) $('<li>').html('<h3>You haven\'t selected any games from this device yet!</h3><p></p>').appendTo("#speclist");	
	//Magic!
	$("#speclist").listview();
	//IE makes the bar disappear sometimes, remove and add it back!
	$('#IEFix').removeClass('ui-header ui-bar-a');
	$('#IEFix').addClass('ui-header ui-bar-a');	
}

//Create the Recent list
function getRecent() {
	//Copy the ISOList! We don't want to mess up the other menus
	var ISOlist = data.ISOlist.slice();
	//To speed switching between tabs up, we hide the alphabetic list and show a short "special" list
	//Because the special lists can change in one use, we always refresh those, but only load the alphabetic list once
	$('#speclister').show();
	$('#lister').hide();
	$("#speclister").html('<ul id="speclist" data-role="listview" data-filter="true" data-inset="true"></ul>');
	$('<li data-role="list-divider">').html('<h3>Recently Played</h3>').appendTo("#speclist");
	//Sort it, will be replaced with server stored info later
	ISOlist.sort(function(x,y) { 
		var JSONx = eval('('+readCookie(x.id)+')');
		var lastPlayedx = JSONx.lastPlayed;
		var JSONy = eval('('+readCookie(y.id)+')');
		var lastPlayedy = JSONy.lastPlayed;
		return lastPlayedy - lastPlayedx;
	});
	//We only want 5
	ISOlist.splice(5, ISOlist.length-5);
	var iso;
	var id;
	var cover;
	var JSON;
	var lastPlayed;
	for (var i=0;i<ISOlist.length;i++) {
		iso = ISOlist[i].name;
		id = ISOlist[i].id;
		cover = ISOlist[i].image;
		JSON = eval('('+readCookie(id)+')');
		lastPlayed = JSON.lastPlayed;
		if (lastPlayed == null || lastPlayed==0) {
			createCookie(id, '{timesPlayed: 0, lastPlayed: 0}');
			//Never played D: Get the hell out!
			break;
		}
		$('<li id="'+iso+'">').html('<a href="#" onclick=\'prepGame(\"'+id+'\",\"'+escape(iso)+'\")\'><img id="cover" src="'+cover+'"/><h3>'+iso+'</h3><p>Last played <span class="easydate" id="'+id+'">'+new Date(lastPlayed)+'</span></p></a>').appendTo("#speclist");
		//Date magic!
		$(".easydate").easydate(); 
	}
			
	if ($('#isolist>li').length == 1) $('<li>').html('<h3>You haven\'t selected any games from this device yet!</h3><p></p>').appendTo("#speclist");
	//Magic!
	$("#speclist").listview();
	//IE makes the bar disappear sometimes, remove and add it back!
	$('#IEFix').removeClass('ui-header ui-bar-a');
	$('#IEFix').addClass('ui-header ui-bar-a');
}

//Game chosen? Sweet! We need to do some stuff first though...
function prepGame(id, name) {
	//Show the game info from appropriate XML file
	//Huge design issue right now when on smaller screens, someone a suggestion?
	gameInfo(id, name);
	//From older popup system, yet to be integrated into the new design
	/*$.ajax({
		type: "GET",
		url: "data.xml",
		dataType: "xml",
		cache: false,
		success: function(xml) {
			var tray = $(xml).find('TRAYSTATE').text();
			var guistate = $(xml).find("GUISTATE").text();
			if (tray == 0) {
                var tray = "Your tray appears to be already open, have fun!"
            } else {
                if (tray == 1 && guistate == 1) {
                    var tray = "Please open your DVD tray."
                } else {
                    if (tray == 1 && guistate == 2) {
                        var tray = 'A game appears to be already loaded, please open your DVD tray and click "Load Game Again".'
                    }
                }
			}
			$('#gameName').html(unescape(name));
			$('#trayState').html(tray);
		}
	});*/
	//There's a bug with the iPad if we're fullscreen in Cover Slide, kick it out.
	//I don't know if there're other devices that have it, so we just always kick it out
	var CoverSlide = Galleria.get(0);
	if (CoverSlide) {
		if (CoverSlide.isFullscreen()) CoverSlide.exitFullscreen();
	}
	//Update the cookies, soon to be server side storage
	var JSON = eval('('+readCookie(id)+')');
	var timesPlayed = JSON.timesPlayed;
	createCookie(id, '{timesPlayed:' + (timesPlayed+1) +', lastPlayed:' + Date.parse(new Date) + '}');
	//Update the playtimes on the menu's
	updatePlayTimes(id);
	//launchGame(id);
}

//Actually loads the game
function launchGame(id) {
   var url = "launchgame.sh?"+id;
   $.get(url);
   //Experimental error system, still needs work
   //var t=setTimeout("getErrors()", 3000);
}

//Some functions to easily communicate with cookies
//Will be removed once we get server side storage
function createCookie(name,value) {
	document.cookie = name+"="+value+"; expires=Mon, 1 Jan 2020 00:00:00 UTC; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) {
			return c.substring(nameEQ.length,c.length);
		}	
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

//Update the menu play times
function updatePlayTimes(id) {
	//Specificly update a game
	if (id) {
		var data = $('span#'+id);
		var JSON = eval('('+readCookie(id)+')');
		var current = JSON.timesPlayed;
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

//Reset stats from the About menu
function resetStats() {
	for (var i = 0; i<data.ISOlist.length; i++) {
		createCookie(data.ISOlist[i].id, '{timesPlayed: 0, lastPlayed: 0}');
	}
	$('#resetStatsButton>span>span').html("Done!");
	var resetText = setTimeout("$('#resetStatsButton>span>span').html('Reset Game Stats')","3000");
	//Update the visual playtimes
	updatePlayTimes();
}

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
}

//The new game info system/design, still needs moar work
//Messy as hell
function gameInfo(id, name) {
	var url = 'covers/'+id+'.xml';
	$.ajax({
		type: "GET",
		url: url,
		dataType: "xml",
		cache: false,
		success: function(xml) {
			$().toastmessage('showNormalToast', '<div id="infoblock" class="ui-grid-a"><div id="infoblock1" class="ui-block-a"></div><div id="infoblock2" class="ui-block-b"></div></div>');
			$('.toast-container').css('margin-left','-'+$('.toast-container').width()/2+'px');
			var cover = '<img align="left" src="covers/'+id+'.jpg" style="width:'+($('#infoblock1').width()-10)+'px;"><br/>Tools<br/><a onclick="launchGame(\"'+id+'\")" href="#" data-role="button" data-inline="true">Play Game</a><br/><a onclick="addFav()" href="#" data-role="button" data-inline="true">Add to favorites</a><br/><a onclick="$().toastmessage(\'removeToast\',$(\'.toast-type-normal\'))" href="#" data-role="button" data-inline="true">Close</a>'
			$(cover).appendTo('#infoblock1');
			var title;
			if ($(xml).find('title').text()=="No Title") var title = unescape(name);
			else title = $(xml).find('title').text();
			var info = '<div style="padding:5px;"><big><big><big>'+title+'</big></big></big><br/><br/><div id="infoItems"></div><br/>'+$(xml).find('summary').text()+'<br/></div>';
			$(info).appendTo('#infoblock2');
			var infoitems;
			$(xml).find('infoitem').each(function() {
				$('#infoItems').append($(this).text()+'<br/>');
			});
			$('#infoblock').trigger('create');
		},
		error: function(xml) {
			//No game.xml? Probably old firmware
			$().toastmessage('showErrorToast', 'Error reading {gameName}.xml, are you on the latest firmware?');
			$('.toast-container').css('margin-left','-'+$('.toast-container').width()/2+'px');
		}
	});
}

//Had the idea for favorite lists, didn't have the time yet
function addFav() {
	var favList = readCookie('FavLists');
	if (favList == null) var favToast = $().toastmessage('showErrorToast', '<div id="newStoof">No favourite lists found! Please create one.<br/><center><input id="favListName" style="width:40%" value="List Name" type="text"/></center><br/><a onclick="createFavList()" href="#" data-role="button" data-inline="true">Create List</a></div>');
	$('#newStoof').trigger('create');
}

function createFavList() {
	alert('I\'m not ready yet!');
}