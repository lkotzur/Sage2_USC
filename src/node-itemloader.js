// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2014

/**
 * @module itemLoader
 */


var fs        = require('fs');
var path      = require('path');
var url       = require('url');

var unzip     = require('decompress-zip');
var ffprobe   = require('node-ffprobe');
var gm        = require('gm');
var imageinfo = require('imageinfo');
var mime      = require('mime');
var request   = require('request');
var ytdl      = require('ytdl-core');

var pdfinfo = require('./node-pdfinfo').pdfinfo;     // custom node module

var imageMagick;
mime.default_type = "application/custom";


function encodeReservedURL(url) {
	return encodeURI(url).replace(/\$/g, "%24").replace(/\&/g, "%26").replace(/\+/g, "%2B").replace(/\,/g, "%2C").replace(/\//g, "%2F").replace(/\:/g, "%3A").replace(/\;/g, "%3B").replace(/\=/g, "%3D").replace(/\?/g, "%3F").replace(/\@/g, "%40");
}

//////////////////////////////////////////////////////////////////////////////////////////
function appLoader(publicDir, hostOrigin, displayWidth, displayHeight, titleBarHeight, imConstraints) {
	this.publicDir = publicDir;
	this.hostOrigin = hostOrigin;
	this.displayWidth = displayWidth;
	this.displayHeight = displayHeight;
	this.titleBarHeight = titleBarHeight;
	this.mime2app = {
		"image/jpeg": "image_viewer", 
		"image/png": "image_viewer",
		"image/bmp": "image_viewer",
		"image/tiff": "image_viewer",
		"image/vnd.adobe.photoshop": "image_viewer",
		"video/mp4": "movie_player",
		"video/youtube": "movie_player",
		"application/pdf": "pdf_viewer", 
		"application/zip": "custom_app",
		"application/x-zip-compressed": "custom_app",
		"application/custom": "custom_app",
		"application/stream": "media_stream"
    };
    this.app2dir = {
    	"image_viewer": "images",
    	"movie_player": "videos",
    	"pdf_viewer": "pdfs",
    	"custom_app": "apps"
    };
	
	imageMagick = gm.subClass(imConstraints);
}

appLoader.prototype.scaleAppToFitDisplay = function(appInstance) {
	var wallRatio = this.displayWidth / (this.displayHeight-this.titleBarHeight);
	var iWidth    = appInstance.native_width;
	var iHeight   = appInstance.native_height;
	// Image wider than wall
	if(iWidth > (this.displayWidth - (2*this.titleBarHeight)) && appInstance.aspect >= wallRatio) {
		// Image wider than wall
		iWidth  = this.displayWidth - (2*this.titleBarHeight);
		iHeight = iWidth / appInstance.aspect;
	}
	// Image taller than wall
	else if(iHeight > (this.displayHeight - (3*this.titleBarHeight)) && appInstance.aspect < wallRatio) {
		// Wall wider than image
		iHeight = this.displayHeight - (3*this.titleBarHeight);
		iWidth  = iHeight*appInstance.aspect;
	}
	
	appInstance.width = iWidth;
	appInstance.height = iHeight;
};

appLoader.prototype.loadImageFromURL = function(url, mime_type, name, strictSSL, callback) {
	var _this = this;
	request({url: url, encoding: null, strictSSL: strictSSL}, function(err, response, body) {
		if(err) throw err;
		
		var info = imageinfo(body);
		
		_this.loadImageFromDataBuffer(body, info.width, info.height, mime_type, url, url, name, function(appInstance) {
			callback(appInstance);
		});
	});
};

appLoader.prototype.loadYoutubeFromURL = function(url, callback) {
	var _this = this;
	
	ytdl.getInfo(url, function(err, info){
		if(err) throw err;
		
		var mp4 = {index: -1, resolution: 0};
		for(var i=0; i<info.formats.length; i++){
			if(info.formats[i].container == "mp4" && info.formats[i].resolution !== null && info.formats[i].profile != "3d"){
				var res = parseInt(info.formats[i].resolution.substring(0, info.formats[i].resolution.length-1));
				if(res > mp4.resolution){
					mp4.index = i;
					mp4.resolution = res;
				}
			}
		}

		var name = info.title;
		var aspectRatio = 16/9;
		var resolutionY = mp4.resolution;
		var resolutionX = resolutionY * aspectRatio;
		
		/*
		var poster = info.iurlmaxres;
		if (poster === null) poster = info.iurl;
		if (poster === null) poster = info.iurlsd;
		*/
		
		_this.loadVideoFromURL(url, "video/youtube", info.formats[mp4.index].url, name, function(appInstance) {
			callback(appInstance);
		});
	});
};

appLoader.prototype.loadVideoFromURL = function(url, mime_type, source, name, callback) {
	var _this = this;
	ffprobe(source, function(err, data){
		if(err) throw err;
		
		var i;
		for(i=0; i<data.streams.length; i++){
			if(data.streams[i].codec_type == "video"){
				var aspectRatio = data.streams[i].width / data.streams[i].height;
				
				var appInstance = {
					id: null,
					title: name,
					application: "movie_player",
					type: mime_type,
					url: url,
					data: {
						src: source,
						type: "video/mp4",
						play: false,
						time: 0.0
					},
					resrc: null,
					left: _this.titleBarHeight,
					top: 1.5*_this.titleBarHeight,
					width: data.streams[i].width,
					height: data.streams[i].height,
					native_width: data.streams[i].width,
					native_height: data.streams[i].height,
					previous_left: null,
					previous_top: null,
					previous_width: null,
					previous_height: null,
					maximized: false,
					aspect: aspectRatio,
					animation: false,
					date: new Date()
				};
				_this.scaleAppToFitDisplay(appInstance);
				callback(appInstance);
				return;
			}
		}
	});
};

appLoader.prototype.loadPdfFromURL = function(url, mime_type, name, strictSSL, callback) {
	var local_url = path.join("uploads", "pdfs", name);
	var localPath = path.join(this.publicDir, local_url);
	var _this = this;
	
	var tmp = fs.createWriteStream(localPath);
	tmp.on('error', function(err) {
		if(err) throw err;
	});
	tmp.on('close', function() {
		//loadPDF
		_this.loadPdfFromFile(localPath, mime_type, local_url, url, name, function(appInstance) {
			callback(appInstance);
		});
	});
	request({url: url, strictSSL: strictSSL}).pipe(tmp);
};


appLoader.prototype.loadImageFromDataBuffer = function(buffer, width, height, mime_type, url, external_url, name, callback) {
	var source = buffer.toString("base64");
	var aspectRatio = width / height;
	
	var appInstance = {
		id: null,
		title: name,
		application: "image_viewer",
		type: mime_type,
		url: external_url,
		data: {
			src: source,
			type: mime_type
		},
		resrc: null,
		left: this.titleBarHeight,
		top: 1.5*this.titleBarHeight,
		width: width,
		height: height,
		native_width: width,
		native_height: height,
		previous_left: null,
		previous_top: null,
		previous_width: null,
		previous_height: null,
		maximized: false,
		aspect: aspectRatio,
		animation: false,
		date: new Date()
	};
	this.scaleAppToFitDisplay(appInstance);
	callback(appInstance);
};

appLoader.prototype.loadImageFromFile = function(file, mime_type, url, external_url, name, callback) {
	var _this = this;
	
	if(mime_type === "image/jpeg" || mime_type === "image/png"){
		fs.readFile(file, function (err, data) {
			if(err) throw err;
			
			var info = imageinfo(data);
			
			_this.loadImageFromDataBuffer(data, info.width, info.height, mime_type, url, external_url, name, function(appInstance) {
				callback(appInstance);
			});
		});
	}
	else{
		imageMagick(file+"[0]").noProfile().bitdepth(8).flatten().setFormat("PNG").toBuffer(function (err, buffer) {
			if(err) throw err;
			
			imageMagick(buffer).size(function (err, size) {
				if(err) throw err;
				
				_this.loadImageFromDataBuffer(buffer, size.width, size.height, "image/png", url, external_url, name, function(appInstance) {
					callback(appInstance);
				});
			});
		});
		
	}
};

appLoader.prototype.loadVideoFromFile = function(file, mime_type, url, external_url, name, callback) {
	var _this = this;
	ffprobe(file, function(err, data){
		if(err) throw err;
		
		var i;
		for(i=0; i<data.streams.length; i++){
			if(data.streams[i].codec_type == "video"){
				var aspectRatio = data.streams[i].width / data.streams[i].height;
				
				var appInstance = {
					id: null,
					title: name,
					application: "movie_player",
					type: mime_type,
					url: external_url,
					data: {
						src: external_url,
						type: "video/mp4",
						play: false,
						time: 0.0
					},
					resrc: null,
					left: _this.titleBarHeight,
					top: 1.5*_this.titleBarHeight,
					width: data.streams[i].width,
					height: data.streams[i].height,
					native_width: data.streams[i].width,
					native_height: data.streams[i].height,
					previous_left: null,
					previous_top: null,
					previous_width: null,
					previous_height: null,
					maximized: false,
					aspect: aspectRatio,
					animation: false,
					date: new Date()
				};
				_this.scaleAppToFitDisplay(appInstance);
				callback(appInstance);
				return;
			}
		}
	});
};

appLoader.prototype.loadPdfFromFile = function(file, mime_type, url, external_url, name, callback) {
	var _this = this;
	pdfinfo(file, function(err, doc) {
		if(err) throw err;

		var aspectRatio = doc.page_width/doc.page_height;
		
		var appInstance = {
			id: null,
			title: name,
			application: "pdf_viewer",
			type: mime_type,
			url: external_url,
			data: {
				src: external_url,
				page: 1,
				numPagesShown: 1
			},
			resrc: null,
			left: _this.titleBarHeight,
			top: 1.5*_this.titleBarHeight,
			width: doc.page_width,
			height: doc.page_height,
			native_width: doc.page_width,
			native_height: doc.page_height,
			previous_left: null,
			previous_top: null,
			previous_width: null,
			previous_height: null,
			maximized: false,
			aspect: aspectRatio,
			animation: false,
			date: new Date()
		};
		_this.scaleAppToFitDisplay(appInstance);
		callback(appInstance);
	});
};

appLoader.prototype.loadAppFromFile = function(file, mime_type, url, external_url, name, callback) {
	var _this = this;
	var zipFolder = file;

	var instuctionsFile = path.join(zipFolder, "instructions.json");
	fs.readFile(instuctionsFile, 'utf8', function(err, json_str) {
		if(err) throw err;

		var instructions = JSON.parse(json_str);
		var appName = instructions.main_script.substring(0, instructions.main_script.lastIndexOf('.'));
		var aspectRatio = instructions.width / instructions.height;
		// if icon provided, build the url to it
		var icon = instructions.icon ? url+"/"+instructions.icon : null;

		var appInstance = {
			id: null,
			title: name,
			application: appName,
			type: mime_type,
			url: external_url,
			data: instructions.load,
			resrc: instructions.resources,
			icon: icon,
			left: _this.titleBarHeight,
			top: 1.5*_this.titleBarHeight,
			width: instructions.width,
			height: instructions.height,
			native_width: instructions.width,
			native_height: instructions.height,
			previous_left: null,
			previous_top: null,
			previous_width: null,
			previous_height: null,
			maximized: false,
			aspect: aspectRatio,
			animation: instructions.animation,
			date: new Date()
		};
		//_this.scaleAppToFitDisplay(appInstance);
		callback(appInstance);
	});
};

appLoader.prototype.loadZipAppFromFile = function(file, mime_type, url, external_url, name, callback) {
	var _this = this;
	var zipFolder = path.join(path.dirname(file), name);

	var unzipper = new unzip(file);
	unzipper.on('extract', function(log) {
		// read instructions for how to handle
		var instuctionsFile = path.join(zipFolder, "instructions.json");
		fs.readFile(instuctionsFile, 'utf8', function(err, json_str) {
			if(err) throw err;

			var instructions = JSON.parse(json_str);
			var appName = instructions.main_script.substring(0, instructions.main_script.lastIndexOf('.'));
			var aspectRatio = instructions.width / instructions.height;
			// if icon provided, build the url to it
			var icon = instructions.icon ? url+instructions.icon : null;

			var appInstance = {
				id: null,
				title: name,
				application: appName,
				type: mime_type,
				url: external_url,
				data: instructions.load,
				resrc: instructions.resources,
				icon: icon,
				left: _this.titleBarHeight,
				top: 1.5*_this.titleBarHeight,
				width: instructions.width,
				height: instructions.height,
				native_width: instructions.width,
				native_height: instructions.height,
				previous_left: null,
				previous_top: null,
				previous_width: null,
				previous_height: null,
				maximized: false,
				aspect: aspectRatio,
				animation: instructions.animation,
				date: new Date()
			};
			_this.scaleAppToFitDisplay(appInstance);
			callback(appInstance);
		});

		// delete original zip file
		fs.unlink(file, function(err) {
			if(err) throw err;
		});
	});
	unzipper.extract({
		path: path.dirname(file),
		filter: function(extractedFile) {
			if(extractedFile.type === "SymbolicLink") return false;
			if(extractedFile.filename === "__MACOSX") return false;
			if(extractedFile.filename.substring(0,1) === ".") return false;
			if(extractedFile.parent.length >= 8 && extractedFile.parent.substring(0,8) === "__MACOSX") return false;

			return true;
		}
	});
};

appLoader.prototype.createMediaStream = function(source, type, encoding, name, width, height, callback) {
	var aspectRatio = width/height;
	
	var appInstance = {
		id: null,
		title: name,
		application: "media_stream",
		type: "application/stream",
		url: null,
		data: {
			src: source,
			type: type,
			encoding: encoding
		},
		resrc: null,
		left: this.titleBarHeight,
		top: 1.5*this.titleBarHeight,
		width: width,
		height: height,
		native_width: width,
		native_height: height,
		previous_left: null,
		previous_top: null,
		previous_width: null,
		previous_height: null,
		maximized: false,
		aspect: aspectRatio,
		animation: false,
		date: new Date()
	};
	this.scaleAppToFitDisplay(appInstance);
	callback(appInstance);
};

appLoader.prototype.loadApplicationFromRemoteServer = function(application, callback) {
	var _this = this;
	this.loadApplication({location: "remote", application: application}, function(appInstance) {
		// cannot use same video url source for youtube
		// must dynamically generate new one
		if(application.type === "video/youtube") {
			_this.loadYoutubeFromURL(application.url, function(youtubeApp) {
				appInstance.data.src = youtubeApp.data.src;
				callback(appInstance);
			});
		}
		else {
			callback(appInstance);
		}
	});
};

appLoader.prototype.loadFileFromWebURL = function(file, callback) {
	var mime_type = file.type;
	var filename = decodeURI(file.url.substring(file.url.lastIndexOf("/")+1));
	
	this.loadApplication({location: "url", url: file.url, type: mime_type, name: filename, strictSSL: true}, function(appInstance) {
		callback(appInstance);
	});
};

appLoader.prototype.loadFileFromLocalStorage = function(file, callback) {
	var app = file.application;
	var dir = this.app2dir[app];
	
	var url = path.join("uploads", dir, file.filename);
	var external_url = this.hostOrigin + encodeReservedURL(url);
	var localPath = path.join(this.publicDir, url);
	var mime_type = mime.lookup(localPath);
	
	this.loadApplication({location: "file", path: localPath, url: url, external_url: external_url, type: mime_type, name: file.filename, compressed: false}, function(appInstance) {
		callback(appInstance);
	});
};

appLoader.prototype.manageAndLoadUploadedFile = function(file, callback) {
	var mime_type = file.headers['content-type'];
	var app = this.mime2app[mime_type];
	if (app === undefined) { callback(null); return; }
	var dir = this.app2dir[app];
	
	var _this = this;
	var url = path.join("uploads", dir, file.originalFilename);
	var external_url = this.hostOrigin + encodeReservedURL(url);
	var localPath = path.join(this.publicDir, url);
	
	fs.rename(file.path, localPath, function(err) {
		if(err) throw err;
		
		_this.loadApplication({location: "file", path: localPath, url: url, external_url: external_url, type: mime_type, name: file.originalFilename, compressed: true}, function(appInstance) {
			callback(appInstance);
		});
	});
};

appLoader.prototype.loadApplication = function(appData, callback) {
	var app = null;

	if(appData.location === "file") {
		app = this.mime2app[appData.type];
		var dir = this.app2dir[app];
		
		if(app === "image_viewer"){
			this.loadImageFromFile(appData.path, appData.type, appData.url, appData.external_url, appData.name, function(appInstance) {
				callback(appInstance);
			});
		}
		else if(app === "movie_player"){
			this.loadVideoFromFile(appData.path, appData.type, appData.url, appData.external_url, appData.name, function(appInstance) {
				callback(appInstance);
			});
		}
		else if(app === "pdf_viewer"){
			this.loadPdfFromFile(appData.path, appData.type, appData.url, appData.external_url, appData.name, function(appInstance) {
				callback(appInstance);
			});
		}
		else if(app === "custom_app"){
			if(appData.compressed === true) {
				var name = path.basename(appData.name, path.extname(appData.name));
				var url = path.join("uploads", dir, name);
				var external_url = this.hostOrigin + encodeReservedURL(url);
				this.loadZipAppFromFile(appData.path, appData.type, url, external_url, name, function(appInstance) {
					callback(appInstance);
				});
			}
			else {
				this.loadAppFromFile(appData.path, appData.type, appData.url, appData.external_url, appData.name, function(appInstance) {
					callback(appInstance);
				});
			}
		}
	}
	
	else if(appData.location === "url") {
		app = this.mime2app[appData.type];
		
		if(app === "image_viewer"){
			this.loadImageFromURL(appData.url, appData.type, appData.name, appData.strictSSL, function(appInstance) {
				callback(appInstance);
			});
		}
		else if(app === "movie_player"){
			if(appData.type === "video/youtube"){
				this.loadYoutubeFromURL(appData.url, function(appInstance) {
					callback(appInstance);
				});
			}
			else{
				this.loadVideoFromURL(appData.url, appData.type, appData.url, appData.name, function(appInstance) {
					callback(appInstance);
				});
			}
		}
		else if(app === "pdf_viewer"){
			this.loadPdfFromURL(appData.url, appData.type, appData.name, appData.strictSSL, function(appInstance) {
				callback(appInstance);
			});
		}
	}
	
	else if(appData.location === "remote") {
		var appInstance = {
			id: appData.application.id,
			title: appData.application.title,
			application: appData.application.application,
			type: appData.application.type,
			url: appData.application.url,
			data: appData.application.data,
			resrc: appData.application.resrc,
			left: this.titleBarHeight,
			top: 1.5*this.titleBarHeight,
			width: appData.application.native_width,
			height: appData.application.native_height,
			native_width: appData.application.native_width,
			native_height: appData.application.native_height,
			previous_left: null,
			previous_top: null,
			previous_width: null,
			previous_height: null,
			maximized: false,
			aspect: appData.application.aspect,
			animation: appData.application.animation,
			date: new Date()
		};
		this.scaleAppToFitDisplay(appInstance);
		callback(appInstance);
	}
};

module.exports = appLoader;
//////////////////////////////////////////////////////////////////////////////////////////
