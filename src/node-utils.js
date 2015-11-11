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
 * Provides utility functions for the SAGE2 server
 *
 * @class node-utils
 * @module server
 * @submodule node-utils
 * @requires package.json, request, semver
 */

// require variables to be declared
"use strict";

var SAGE2_version = require('../package.json').version;

var crypto  = require('crypto');              // https encryption
var exec    = require('child_process').exec;  // execute external application
var fs      = require('fs');                  // filesystem access
var path    = require('path');                // resolve directory paths
var tls     = require('tls');                 // https encryption

var request   = require('request');           // http requests
var semver    = require('semver');            // parse version numbers
var fsmonitor = require('fsmonitor');         // file system monitoring

/**
 * Parse and store NodeJS version number: detect version 0.10.x or newer
 *
 * @property _NODE_VERSION
 * @type {Number}
 */
var _NODE_VERSION = 0;
if (semver.gte(process.versions.node, '0.10.0')) {
	_NODE_VERSION = 10;
	if (semver.gte(process.versions.node, '0.11.0')) {
		_NODE_VERSION = 11;
	}
	if (semver.gte(process.versions.node, '0.12.0')) {
		_NODE_VERSION = 12;
	}
	if (semver.gte(process.versions.node, '1.0.0')) {
		_NODE_VERSION = 1;
	}
} else {
	throw new Error(" SAGE2>\tOld version of Node.js. Please update");
}

/**
 * Test if file is exists
 *
 * @method fileExists
 * @param filename {String} name of the file to be tested
 * @return {Bool} true if exists
 */
function fileExists(filename) {

	if (_NODE_VERSION === 10 || _NODE_VERSION === 11) {
		return fs.existsSync(filename);
	} else {
		// Versions 1.x or above
		try {
			// fs.accessSync(filename, fs.R_OK);
			var res = fs.statSync(filename);
			return res.isFile();
		} catch (err) {
			return false;
		}
	}
}

/**
 * Test if folder is exists
 *
 * @method folderExists
 * @param directory {String} name of the folder to be tested
 * @return {Bool} true if exists
 */
function folderExists(directory) {
	if (_NODE_VERSION === 10 || _NODE_VERSION === 11) {
		return fs.existsSync(directory);
	} else {
		// Versions 1.x or above
		try {
			var res = fs.statSync(directory);
			return res.isDirectory();
		} catch (err) {
			return false;
		}
	}
}

/**
 * Create a SSL context / credentials
 *
 * @method secureContext
 * @param key {String} public key
 * @param crt {String} private key
 * @param ca  {String} CA key
 * @return {Object} secure context
 */
function secureContext(key, crt, ca) {
	var ctx;
	if (_NODE_VERSION === 10) {
		ctx = crypto.createCredentials({key: key, cert: crt, ca: ca});
	} else {
		// Versions 11 or 1.x or above
		ctx = tls.createSecureContext({key: key, cert: crt, ca: ca});
	}
	return ctx.context;
}

/**
 * Load a CA bundle file and return an array of certificates
 *
 * @method loadCABundle
 * @param filename {String} name of the file to parse
 * @return {Array} array of certificates data
 */
function loadCABundle(filename) {
	// Initialize the array of certs
	var certs_array = [];
	var certs_idx   = -1;
	// Read the file
	if (fileExists(filename)) {
		var rawdata = fs.readFileSync(filename, {encoding: 'utf8'});
		var lines   = rawdata.split('\n');
		lines.forEach(function(line) {
			if (line === "-----BEGIN CERTIFICATE-----") {
				certs_idx = certs_idx + 1;
				certs_array[certs_idx] = line + '\n';
			} else if (line === "-----END CERTIFICATE-----") {
				certs_array[certs_idx] += line;
			} else {
				certs_array[certs_idx] += line + '\n';
			}
		});
	} else {
		console.log('loadCABundle>	Could not find CA file:', filename);
	}
	return certs_array;
}


/**
 * Base version comes from evaluating the package.json file
 *
 * @method getShortVersion
 * @return {String} version number as x.x.x
 */
function getShortVersion() {
	return SAGE2_version;
}


/**
 * Node.js version
 *
 * @method getNodeVersion
 * @return {String} version number
 */
function getNodeVersion() {
	return _NODE_VERSION.toString() +  " (v" +  process.versions.node + ")";
}

/**
 * Full version is processed from git information
 *
 * @method getFullVersion
 * @param callback {Function} function to be run when finished, parameter is an object containing base, branch,
 *        commit and date fields
 */
function getFullVersion(callback) {
	var fullVersion  = {base: "", branch: "", commit: "", date: ""};
	// get the base version from package.json file
	fullVersion.base = getShortVersion();

	// get to the root folder of the sources
	var dirroot = path.resolve(__dirname, '..');
	var cmd1 = "git rev-parse --abbrev-ref HEAD";
	exec(cmd1, { cwd: dirroot, timeout: 3000}, function(err1, stdout1, stderr1) {
		if (err1) {
			callback(fullVersion);
			return;
		}

		var branch = stdout1.substring(0, stdout1.length - 1);
		var cmd2 = "git log --date=\"short\" --format=\"%h|%ad\" -n 1";
		exec(cmd2, { cwd: dirroot, timeout: 3000}, function(err2, stdout2, stderr2) {
			if (err2) { callback(fullVersion); return; }

			// parsing the results
			var result = stdout2.replace(/\r?\n|\r/g, "");
			var parse  = result.split("|");

			// filling up the object
			fullVersion.branch = branch; // branch.substring(1, branch.length-1);
			fullVersion.commit = parse[0];
			fullVersion.date   = parse[1].replace(/-/g, "/");

			// return the object in the callback paramter
			callback(fullVersion);
		});
	});
}

/**
 * Upate the source code using git
 *
 * @method updateWithGIT
 * @param branch {String} name of the remote branch
 * @param callback {Function} function to be run when finished
 */
function updateWithGIT(branch, callback) {
	// get to the root folder of the sources
	var dirroot = path.resolve(__dirname, '..');
	var cmd1 = "git pull origin " + branch;
	exec(cmd1, { cwd: dirroot, timeout: 5000}, function(err, stdout, stderr) {
		// return the messages in the callback paramter
		if (err) {
			callback(stdout + ' : ' + stderr, null);
		} else {
			callback(null, stdout);
		}
	});
}


/**
 * Utility function to create a header for console messages
 *
 * @method header
 * @param h {String} header text
 * @return header {String} formatted text
 */
function header(h) {
	if (h.length <= 6) {
		return h + ">\t\t";
	} else {
		return h + ">\t";
	}
}


/**
 * Utility function to compare two strings independently of case.
 * Used for sorting
 *
 * @method compareString
 * @param a {String} first string
 * @param b {String} second string
 */
function compareString(a, b) {
	var nA = a.toLowerCase();
	var nB = b.toLowerCase();
	if (nA < nB) {
		return -1;
	} else if (nA > nB) {
		return 1;
	}
	return 0;
}

/**
 * Utility function, used while sorting, to compare two objects based on filename independently of case.
 * Needs a .exif.FileName field
 *
 * @method compareFilename
 * @param a {Object} first object
 * @param b {Object} second object
 */
function compareFilename(a, b) {
	var nA = a.exif.FileName.toLowerCase();
	var nB = b.exif.FileName.toLowerCase();
	if (nA < nB) {
		return -1;
	} else if (nA > nB) {
		return 1;
	}
	return 0;
}

/**
 * Utility function to compare two objects based on title independently of case.
 * Needs a .exif.metadata.title field
 * Used for sorting
 *
 * @method compareTitle
 * @param a {Object} first object
 * @param b {Object} second object
 */
function compareTitle(a, b) {
	var nA = a.exif.metadata.title.toLowerCase();
	var nB = b.exif.metadata.title.toLowerCase();
	if (nA < nB) {
		return -1;
	} else if (nA > nB) {
		return 1;
	}
	return 0;
}

/**
 * Utility function to test if a string or number represents a true value.
 * Used for parsing JSON values
 *
 * @method isTrue
 * @param value {Object} value to test
 */
function isTrue(value) {
	if (typeof value === 'string') {
		value = value.toLowerCase();
	}
	switch (value) {
		case true:
		case "true":
		case 1:
		case "1":
		case "on":
		case "yes": {
			return true;
		}
		default: {
			return false;
		}
	}
}

/**
 * Compare the installed pacakges versus the specified ones in packages.json
 *   warms the user of outdated packages
 *
 * @method checkPackages
 * @param inDevelopement {Bool} whether or not to check in production mode (no devel packages)
 */
function checkPackages(inDevelopement) {
	var packages = {missing: [], outdated: []};
	// check the commonly used NODE_ENV variable (development or production)
	var indevel  = (process.env.NODE_ENV === 'development') || isTrue(inDevelopement);
	var command  = "npm outdated --depth 0 --json  --production";
	if (indevel) {
		command = "npm outdated --depth 0 --json";
	}
	exec(command, {cwd: path.normalize(path.join(__dirname, ".."))},
		function(error, stdout, stderr) {
			if (error) {
				console.log("NPM>	Error running update");
				return;
			}

			var key;
			var output = stdout ? JSON.parse(stdout) : {};
			for (key in output) {
				// if not a valid version number
				if (!semver.valid(output[key].current)) {
					packages.missing.push(key);
				} else if (semver.lt(output[key].current, output[key].wanted)) {
					// if the version is strictly lower than requested
					packages.outdated.push(key);
				}
			}

			if (packages.missing.length > 0 || packages.outdated.length > 0) {
				console.log("");
				console.log(header("Packages") + "Warning - Packages not up to date");
				if (packages.missing.length  > 0) {
					console.log(header("Packages") + "  Missing:",  packages.missing);
				}
				if (packages.outdated.length > 0) {
					console.log(header("Packages") + "  Outdated:", packages.outdated);
				}
				console.log(header("Packages") + "To update, execute: npm run in");
				console.log("");
			} else {
				console.log(header("Packages") + "All packages up to date");
			}
		}
	);
}


/**
 * Register SAGE2 with EVL server
 *
 * @method registerSAGE2
 * @param config {Object} local SAGE2 configuration
 */
function registerSAGE2(config) {
	request({
		rejectUnauthorized: false,
		// url: 'https://sage.evl.uic.edu/register',
		url: 'https://131.193.183.150/register',
		form: config,
		method: "POST"},
		function(err, response, body) {
			console.log(header("SAGE2") + "Registration with EVL site:", (err === null) ? "success" : err.code);
		}
	);
}

/**
 * Unregister from EVL server
 *
 * @method deregisterSAGE2
 * @param config {Object} local SAGE2 configuration
 * @param callback {Function} to be called when done
 */
function deregisterSAGE2(config, callback) {
	request({
		rejectUnauthorized: false,
		// url: 'https://sage.evl.uic.edu/unregister',
		url: 'https://131.193.183.150/unregister',
		form: config,
		method: "POST"},
		function(err, response, body) {
			console.log(header("SAGE2") + "Deregistration with EVL site:", (err === null) ? "success" : err.code);
			if (callback) {
				callback();
			}
		}
	);
}

/**
 * Return a safe URL string: convert odd characters to HTML representations
 *
 * @method encodeReservedURL
 * @param aUrl {String} URL to be sanitized
 * @return {String} cleanup version of the URL
 */
function encodeReservedURL(aUrl) {
	return encodeURI(aUrl).replace(/\$/g, "%24").replace(/\&/g, "%26").replace(/\+/g, "%2B")
			.replace(/\,/g, "%2C").replace(/\:/g, "%3A").replace(/\;/g, "%3B").replace(/\=/g, "%3D")
			.replace(/\?/g, "%3F").replace(/\@/g, "%40");
}

/**
 * Return a safe URL string: make Windows path to URL
 *
 * @method encodeReservedPath
 * @param aUrl {String} URL to be sanitized
 * @return {String} cleanup version of the URL
 */
function encodeReservedPath(aPath) {
	return encodeReservedURL(aPath.replace(/\\/g, "/"));
}


/**
 * Return a home directory on every platform
 *
 * @method getHomeDirectory
 * @return {String} string representing a folder path
 */
function getHomeDirectory() {
	return process.env[ (process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}


/**
 * Creates recursively a series of folders if needed (synchronous function and throws error)
 *
 * @method mkdirParent
 * @param dirPath {String} path to be created
 * @return {String} null or directory created
 */
function mkdirParent(dirPath) {
	var made = null;
	dirPath = path.resolve(dirPath);
	try {
		fs.mkdirSync(dirPath);
		made = dirPath;
	}
	catch (err0) {
		switch (err0.code) {
			case 'ENOENT' : {
				made = mkdirParent(path.dirname(dirPath));
				made = mkdirParent(dirPath);
				break;
			}
			default: {
				var stat;
				try {
					stat = fs.statSync(dirPath);
				}
				catch (err1) {
					throw err0;
				}
				if (!stat.isDirectory()) {
					throw err0;
				}
				made = dirPath;
				break;
			}
		}
	}
	return made;
}


/**
 * Place a callback on a list of folders to monitor.
 *  callback triggered when a change is detected:
 *    this.root contains the monitored folder
 *  parameter contains the following list:
 *    addedFiles, modifiedFiles, removedFiles,
 *    addedFolders, modifiedFolders, removedFolders
 *
 * @method deregisterSAGE2
 * @param folders {Array} list of folders
 * @param callback {Function} to be called when a change is detected
 */
function monitorFolders(folders, excludes, callback) {
	// for each folder
	for (var folder in folders) {
		// get a full path
		var folderpath = path.resolve(folders[folder]);
		// get information on the folder
		var stat       = fs.lstatSync(folderpath);
		// making sure it is a folder
		if (stat.isDirectory()) {
			console.log(header("Monitor") + "watching folder " + folderpath);
			var monitor = fsmonitor.watch(folderpath, {
				// only matching: all true for now
				matches:  function(relpath) {return true; },
				// and excluding: nothing for now
				excludes: function(relpath) {
					return (excludes.indexOf(relpath) !== -1);
					// return false;
				}
			});
			// place the callback the change event
			monitor.on('change', callback);
		}
	}
}

// Example of callback:
//
// function fsChanged(change) {
// 	console.log("fsChanged in", this.root);
// 	console.log("   Added files:    %j",   change.addedFiles);
// 	console.log("   Modified files: %j",   change.modifiedFiles);
// 	console.log("   Removed files:  %j",   change.removedFiles);
// 	console.log("   Added folders:    %j", change.addedFolders);
// 	console.log("   Modified folders: %j", change.modifiedFolders);
// 	console.log("   Removed folders:  %j", change.removedFolders);
// }
//


module.exports.nodeVersion       = _NODE_VERSION;
module.exports.getNodeVersion    = getNodeVersion;
module.exports.getShortVersion   = getShortVersion;
module.exports.getFullVersion    = getFullVersion;
module.exports.secureContext     = secureContext;
module.exports.fileExists        = fileExists;
module.exports.folderExists      = folderExists;
module.exports.header            = header;
module.exports.compareString     = compareString;
module.exports.compareFilename   = compareFilename;
module.exports.compareTitle      = compareTitle;
module.exports.isTrue            = isTrue;
module.exports.updateWithGIT     = updateWithGIT;
module.exports.checkPackages     = checkPackages;
module.exports.registerSAGE2     = registerSAGE2;
module.exports.deregisterSAGE2   = deregisterSAGE2;
module.exports.loadCABundle      = loadCABundle;
module.exports.monitorFolders    = monitorFolders;
module.exports.getHomeDirectory  = getHomeDirectory;
module.exports.encodeReservedURL = encodeReservedURL;
module.exports.mkdirParent       = mkdirParent;

module.exports.encodeReservedPath = encodeReservedPath;

