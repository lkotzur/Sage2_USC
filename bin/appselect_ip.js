#!/usr/bin/env node

// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2015

/**
 * Send a command to a SAGE2 server
 *
 * ./sage_command.js <url> <command> [params]
 *
 * @class command
 * @module commands
 * @submodule command
 */

"use strict";

var path        = require('path');                // file path extraction and creation
var json5       = require('json5');               // JSON5 parsing

// custom node modules
var websocketIO = require('websocketio');   // creates WebSocket server and clients

var connection;
var command;
var wssURL;
var state = 0;
var appid = '';
var apps = {};
var slots = {1: {x: 1930, y: 0}, 2: {x: 5790, y: 0}, 3: {x: 9650, y: 0}};

function moveResize(remote,appnr,x,y,xw,yw) {
  var app = apps[appnr];
  var movecmd = "moveto "+app.appid+" "+x+" "+y;
  var resizecmd = "resize "+app.appid+" "+xw+" "+yw;
  console.log(movecmd);
  console.log(resizecmd);
  remote.emit('command', movecmd);
  remote.emit('command', resizecmd);
}

function thumbnail(remote,appnr){
	console.log("...thumbnail "+appnr);
	var app = apps[appnr];
	console.log("...app "+JSON.stringify(app));
	var thumbx = 0;
	var thumby = 0;
	if (appnr<2) {
	  thumbx = 0;
	  thumby = 1090*appnr;
	} else {
	  var xpos = appnr - 2;
	  thumbx = 1930*xpos;
	  thumby = 1090*2;
	}
	console.log("thumbx "+thumbx);
	moveResize(remote,appnr,thumbx,thumby,1920,1032);
}

function selectApp(remote) {
				var xw = 3850;
				var yw = 2128;
				// find slot 1 if any and move to slot 2
			        var searchgeom = "["+xw+"x"+yw+" +"+slots[1].x+"+"+slots[1].y+"]";
			        console.log("search for "+searchgeom);
				Object.keys(apps).forEach(function(key, index) {
				  var app = this[key];
				  console.log("nr: "+key+" "+JSON.stringify(app));
				  if (app.geometry===searchgeom) {
					console.log("...slot 1 to 2"+app.appid);
					var movecmd = "moveto "+app.appid+" "+slots[2].x+" "+slots[2].y;
					var resizecmd = "resize "+app.appid+" "+xw+" "+yw;
					console.log(movecmd);
					console.log(resizecmd);
					remote.emit('command', movecmd);
					remote.emit('command', resizecmd);
				  }
				}, apps);
				// find slot 2 if any and move to slot 3
			        var searchgeom = "["+xw+"x"+yw+" +"+slots[2].x+"+"+slots[2].y+"]";
				Object.keys(apps).forEach(function(key, index) {
				  var app = this[key];
				  console.log("nr: "+key+" "+JSON.stringify(app));
				  if (app.geometry===searchgeom) {
					console.log("...slot 2 to 3"+app.appid);
					var movecmd = "moveto "+app.appid+" "+slots[3].x+" "+slots[3].y;
					var resizecmd = "resize "+app.appid+" "+xw+" "+yw;
					console.log(movecmd);
					console.log(resizecmd);
					remote.emit('command', movecmd);
					remote.emit('command', resizecmd);
				  }
				}, apps);
				// find slot 3 if any and move to indexed thumbnail slot
			        var searchgeom = "["+xw+"x"+yw+" +"+slots[3].x+"+"+slots[3].y+"]";
				Object.keys(apps).forEach(function(key, index) {
				  var app = this[key];
				  console.log("nr: "+key+" "+JSON.stringify(app));
				  if (app.geometry===searchgeom) {
					thumbnail(remote,key);
				  }
				}, apps);
				var selected = apps[command].appid;
				var movecmd = "moveto "+selected+" "+slots[1].x+" "+slots[1].y;
				var resizecmd = "resize "+selected+" "+xw+" "+yw;
				console.log(movecmd);
				console.log(resizecmd);
				remote.emit('command', movecmd);
				remote.emit('command', resizecmd);
}

function arrangeApps(remote) {
	Object.keys(apps).forEach(function(key, index) {
		console.log("thumbnail "+key);
		thumbnail(remote,key);	
	}, apps);
}

// create the websocket connection and start the timer
function createRemoteConnection(wsURL) {
	var remote = new websocketIO(wsURL, false, function() {
		console.log("Client> connecting to ", wsURL);

		var clientDescription = {
			clientType: "commandline",
			requests: {
				config:  true,
				version: false,
				time:    false,
				console: true
			}
		};

		remote.onclose(function() {
			console.log("Connection closed");
		});

		remote.on('console', function(wsio, data) {
			// just to filter a bit the long outputs
			//if (data.length < 256) {
			// HACK: use start of second command output as signal that first command finished :-(
			if (data.startsWith('Sessions')) {
				process.stdout.write(state+" "+data);
				console.log("apps: "+JSON.stringify(apps));
				console.log("appid: "+appid);
				state = 2;
				if (command==="arrange") {
					arrangeApps(remote);
				} else {
					selectApp(remote);
				}
				setTimeout(function() { process.exit(0); }, 200);
				state = 2;
			}
			else if (state === 1) {
				process.stdout.write(state+" "+data);
				var ws = data.match(' *')[0];
				//console.log("ws: "+ws);
				var id = data.substr(ws+1,data.length).match(' *[0-9]*')[0];
				var idl = id.length;
				var dl = data.length;
				//console.log("id: '"+id+"' "+idl+" "+dl);
				//console.log("ws: "+ws.length);
				var rmdr = data.substring(ws.length+idl+2,dl);
				//console.log("rmdr: "+rmdr);
				var appid = rmdr.match('[^ ]*')[0];
				//console.log("appid: "+appid);
				apps[id] = {appid: appid, data:data};
				apps[id].geometry = data.match('\[[0-9]*x[0-9]* [+-]*[0-9]*[+-]*[0-9]*\]')[0];
			}
			else if (state === 0 && data.startsWith('Applications')) {
				process.stdout.write(state+" "+data);
				state = 1;
			}
		});

		remote.on('initialize', function(wsio, data) {
			console.log('Initialize> uniqueID', data.UID);
			remote.emit('command', "apps");
			remote.emit('command', "sessions");

			// Wait for 1sec to quit
			//setTimeout(function() { process.exit(0); }, 1000);
		});

		remote.on('setupSAGE2Version', function(wsio, data) {
			console.log('SAGE2> version', json5.stringify(data));
		});

		remote.on('setupDisplayConfiguration', function(wsio, data) {
			console.log('SAGE2> display configuration', data.totalWidth, data.totalHeight);
		});

		remote.emit('addClient', clientDescription);
	});

	remote.ws.on('error', function(err) {
		console.log('Client> error', err.errno);
		process.exit(0);
	});

	return remote;
}

// default URL
wssURL = "wss://localhost:443";

if (process.argv.length === 2) {
	console.log('');
	console.log('Usage> sage_command.js <url> <command> [paramaters]');
	console.log('');
	console.log('Example>     ./sage_command.js localhost:9090 load demo');
	console.log('');
	process.exit(0);
}

if (process.argv.length === 3 && ( (process.argv[2] === '-h') || (process.argv[2] === '--help') ) ) {
	console.log('');
	console.log('Usage> sage_command.js <url> <command> [paramaters]');
	console.log('');
	console.log('Example>     ./sage_command.js localhost:9090 load demo');
	console.log('');
	process.exit(0);
}

// If there's an argument, use it as a url
//     wss://hostname:portnumber
if (process.argv.length >= 3) {
	wssURL = process.argv[2];
	if (wssURL.indexOf('wss://')>=0) {
		// all good
	} else if (wssURL.indexOf('ws://')>=0) {
		console.log('Client> switching to wss:// protocol');
		wssURL = wssURL.replace('ws', 'wss');
	} else if (wssURL.indexOf('http://')>=0) {
		console.log('Client> switching to wss:// protocol');
		wssURL = wssURL.replace('http', 'wss');
	} else if (wssURL.indexOf('https://')>=0) {
		console.log('Client> switching to wss:// protocol');
		wssURL = wssURL.replace('https', 'wss');
	} else {
		wssURL = 'wss://' + wssURL;
	}
}

if (process.argv.length === 4) {
	// Remove the first paramaters
	process.argv.splice(0, 3);
	// take all the rest
	command = process.argv.join(' ');
} else {
	// default command if none specified
	command = "help";
}

console.log('Client> sending command:', command);

// Create and go !
connection = createRemoteConnection(wssURL);
console.log('Starting>', connection.ws.url);
