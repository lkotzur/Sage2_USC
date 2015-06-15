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

// npm registry: built-in or defined in package.json
var fs          = require('fs');                  // filesystem access
var http        = require('http');                // http server
var https       = require('https');               // https server
var os          = require('os');                  // operating system access
var path        = require('path');                // file path extraction and creation
var json5       = require('json5');               // JSON5 parsing
var request     = require('request');             // external http requests

// custom node modules
var websocketIO = require(__dirname + '/../src/node-websocket.io');   // creates WebSocket server and clients
var connection;
var imageFilename;
var wssURL;

// Bound random number
function randomNumber(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function postForm(formData, callback) {
	var httpsURL = wssURL.replace('wss', 'https');
	// Post a request to the server (simulating the form upload)
	request.post({url: httpsURL + "/upload", formData: formData, strictSSL: false},
		function optionalCallback(err, httpResponse, body) {
			callback(err);
		}
	);
}

function uploadPictures() {
	// Filling up the form structure
	var formData = {
		file0: {
			value:  fs.createReadStream(imageFilename),
			options: {
				filename:    imageFilename,
				contentType: 'image/jpg'
			}
		}
	};

	postForm(formData, function(err) {
		if (err) {
			console.error('Upload> failed:', err);
			process.exit(0);
		}
		console.log('Upload> success');
		process.exit(0);
		//setTimeout(function() { connection.emit('tileApplications'); }, 100);			
	});
}

// create the websocket connection and start the timer
function createRemoteConnection(wsURL) {
	var remote = new websocketIO(wsURL, false, function() {
		console.log("Client> connecting to ", wsURL);

		var clientDescription = {
			clientType: "uploader",
			requests: {
				config:  true,
				version: false,
				time:    false,
				console: false
			}
		};

		remote.onclose(function() {
			console.log("Connection closed");
		});

		remote.on('initialize', function(wsio, data) {
			console.log('Initialize> uniqueID', data.UID);
			uploadPictures();
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
wssURL        = "wss://localhost:443";
imageFilename = "note.jpg";

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
		console.log('Client> adding to wss:// protocol');
		wssURL = 'wss://' + wssURL;
	}
}

if (process.argv.length >= 4) {
	imageFilename = process.argv[3];
}

console.log('Client> uploading', imageFilename);

// Create and go !
connection = createRemoteConnection(wssURL);