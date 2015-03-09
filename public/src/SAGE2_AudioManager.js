// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2014-15


var wsio;
var hostname;
var port;
var autoplay;
var hostAlias = {};

function SAGE2_init() {
	hostname = window.location.hostname;
	port = window.location.port;
	if(window.location.protocol === "http:"  && port === "") port = "80";
	if(window.location.protocol === "https:" && port === "") port = "443";
	
	autoplay = false;
	
	wsio = new websocketIO();
	
	console.log("Connected to server: ", window.location.origin);
	
	wsio.open(function() {
		console.log("open websocket");
		var clientDescription = {
			clientType: "audioManager",
			sendsPointerData: false,
			sendsMediaStreamFrames: false,
			requestsServerFiles: false,
			sendsWebContentToLoad: false,
			sendsVideoSynchonization: true,
			sharesContentWithRemoteServer: false,
			receivesDisplayConfiguration: true,
			receivesClockTime: false,
			requiresFullApps: true,
			requiresAppPositionSizeTypeOnly: false,
			receivesMediaStreamFrames: false,
			receivesWindowModification: false,
			receivesPointerData: false,
			receivesInputEvents: true,
			receivesRemoteServerInfo: false
		};
		wsio.emit('addClient', clientDescription);
	});
	
	// Socket close event (ie server crashed)		
	wsio.on('close', function (evt) {
		var refresh = setInterval(function () {
			// make a dummy request to test the server every 2 sec
			xhr = new XMLHttpRequest();
			xhr.open("GET", "/", true);
			xhr.onreadystatechange = function() {
				if(xhr.readyState == 4 && xhr.status == 200){
					console.log("server ready");
					// when server ready, clear the interval callback
					clearInterval(refresh);
					// and reload the page
					window.location.reload();
				}
			};
			xhr.send();
		}, 2000);
	});
	
	wsio.on('initialize', function(data) {
		var serverTime = new Date(data.time);
		var clientTime = new Date();
		
		dt = clientTime - serverTime;
	});
	
	wsio.on('setupDisplayConfiguration', function(json_cfg) {
		var i;
		var http_port;
		var https_port;
		
		http_port = json_cfg.index_port === "80" ? "" : ":"+json_cfg.index_port;
		https_port = json_cfg.port === "443" ? "" : ":"+json_cfg.port;
		hostAlias["http://"  + json_cfg.host + http_port]  = window.location.origin;
		hostAlias["https://" + json_cfg.host + https_port] = window.location.origin;
		for(i=0; i<json_cfg.alternate_hosts.length; i++) {
			hostAlias["http://"  + json_cfg.alternate_hosts[i] + http_port]  = window.location.origin;
			hostAlias["https://" + json_cfg.alternate_hosts[i] + https_port] = window.location.origin;
		}

		// play the jinggle
		var jinggle_elt = document.getElementById('jinggle');
		if (json_cfg.ui.startup_sound) {
			var jinggle_src = document.getElementById('jinggle_src');
	        jinggle_src.src = json_cfg.ui.startup_sound;
	    }
		jinggle_elt.load();
		jinggle_elt.play();
	});
	
	wsio.on('createAppWindow', function(data) {
		if(data.application === "movie_player"){
			var main = document.getElementById('main');
			var videosTable = document.getElementById('videos');
			
			var vid = document.createElement('audio');
			vid.id = data.id;
			vid.volume = 0.8;
			vid.style.display = "none";
			vid.addEventListener('canplay', function() {
				console.log("video can now play"); // Video is loaded and can be played
				if(autoplay === true) playVideo(data.id);
			}, false);
			vid.addEventListener('ended', function() {
				console.log("video ended");
				if(autoplay === true) vid.currentTime = 0;
			}, false);
			vid.addEventListener('timeupdate', function() {
				var vid_time = document.getElementById(data.id + "_time");
				if(vid_time) vid_time.textContent = timeToHHMMSS(vid.currentTime);
			}, false);
			
			var url = cleanURL(data.data.audio_url);
			var source = document.createElement('source');
			var param = url.indexOf('?');
			if(param >= 0) source.src = url + "&clientID=audio";
			else source.src = url + "?clientID=audio";
			source.type = data.data.audio_type;
			vid.appendChild(source);
			
			var videoRow = document.createElement('tr');
			videoRow.id = data.id + "_row";
			var title = document.createElement('td');
			title.id = data.id + "_title";
			title.className = "videoTitle";
			title.textContent = data.title;
			
			var volume = document.createElement('td');
			volume.id = data.id + "_volume";
			volume.className = "videoVolume";
			var volumeMute = document.createElement('span');
			volumeMute.id = data.id + "_mute";
			volumeMute.className = "videoVolumeMute";
			volumeMute.innerHTML = "&#x2713;";
			var volumeSlider = document.createElement('input');
			volumeSlider.id = data.id + "_volumeSlider";
			volumeSlider.className = "videoVolumeSlider";
			volumeSlider.type = "range";
			volumeSlider.min = 0;
			volumeSlider.max = 10;
			volumeSlider.step = 1;
			volumeSlider.value = 8;
			volumeSlider.addEventListener('input', changeVolume, false);
			volume.appendChild(volumeMute);
			volume.appendChild(volumeSlider);
			
			var time = document.createElement('td');
			time.id = data.id + "_time";
			time.className = "videoTime";
			time.textContent = "00:00:00";
			
			var play = document.createElement('td');
			play.id = data.id + "_play";
			play.className = "videoPlay";
			play.textContent = "Paused";
			
			videoRow.appendChild(title);
			videoRow.appendChild(volume);
			videoRow.appendChild(time);
			videoRow.appendChild(play);
			
			main.appendChild(vid);
			videosTable.appendChild(videoRow);
		}
		
		if(data.animation === true) wsio.emit('finishedRenderingAppFrame', {id: data.id});
	});
	
	wsio.on('videoPlaying', function(data) {
		var vid      = document.getElementById(data.id);
		var vid_play = document.getElementById(data.id + "_play");
		if(vid)      vid.play();
		if(vid_play) vid_play.textContent = "Playing";
	});
	
	wsio.on('videoPaused', function(data) {
		var vid      = document.getElementById(data.id);
		var vid_play = document.getElementById(data.id + "_play");
		if(vid)      vid.pause();
		if(vid_play) vid_play.textContent = "Paused";
	});
	wsio.on('videoEnded', function(data) {
		var vid      = document.getElementById(data.id);
		var vid_play = document.getElementById(data.id + "_play");
		if(vid)      vid.pause();
		if(vid_play) vid_play.textContent = "Paused";
	});
	
	wsio.on('videoMuted', function(data) {
		var vid      = document.getElementById(data.id);
		var vid_mute = document.getElementById(data.id + "_mute");
		if(vid)      vid.muted = true;
		if(vid_mute) vid_mute.innerHTML = "&#x2717;";
	});
	
	wsio.on('videoUnmuted', function(data) {
		var vid      = document.getElementById(data.id);
		var vid_mute = document.getElementById(data.id + "_mute");
		if(vid)      vid.muted = false;
		if(vid_mute) vid_mute.innerHTML = "&#x2713;";
	});
	
	wsio.on('updateVideoItemTime', function(data) {
		var vid = document.getElementById(data.id);
		if(vid) vid.currentTime = data.timestamp;
	});
	
	wsio.on('deleteElement', function(elem_data) {
		deleteElement(elem_data.elemId);
		deleteElement(elem_data.elemId + "_row");
	});
	
	wsio.on('animateCanvas', function(data) {
		wsio.emit('finishedRenderingAppFrame', {id: data.id});
	});
	
	wsio.on('eventInItem', function(event_data) {
		/*
		var selectedElem = document.getElementById(event_data.id);
		if(selectedElem === undefined || selectedElem === null) return;
		
		if(event_data.type === "keyboard"){
			console.log("received keyboard input: [" + event_data.data.code + "] [" + event_data.data.character + "]"); 
			if(event_data.data.character === " "){ // spacebar
				console.log("play/pause video")
				playPauseVideo(event_data.id);
			}
		}
		*/
	});
}

function cleanURL(url) {
	var a = document.createElement('a');
	a.href = url;
	var clean = url;

	if(hostAlias[a.origin] !== undefined)
		clean = url.replace(a.origin, hostAlias[a.origin]);

	return clean;
}

function deleteElement(id) {
	var elem = document.getElementById(id);
	if(elem !== undefined && elem !== null)
		elem.parentNode.removeChild(elem);
}

function timeToHHMMSS(sec) {
	var totalSec = Math.floor(sec);
	var hh = Math.floor(totalSec / 3600) % 24;
	var mm = Math.floor(totalSec /   60) % 60;
	var ss = totalSec % 60;

	return (hh < 10 ? "0" + hh : hh) + ":" + (mm < 10 ? "0" + mm : mm) + ":" + (ss  < 10 ? "0" + ss : ss);
}

function changeVolume(event) {
	var vol = document.getElementById(event.target.id).value / 10;
	var videoId = event.target.id.substring(0, event.target.id.length-13);
	changeVideoVolume(videoId, vol);
}

function changeVideoVolume(videoId, volume) {
	document.getElementById(videoId).volume = volume;
}

function playVideo(id) {
	wsio.emit('playVideo', {id: id});
}

function pauseVideo(id) {
	wsio.emit('pauseVideo', {id: id});
}
