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
 * @module node-utils
 * @requires package.json, child_process, path
 */

var SAGE2_version = require('../package.json').version;
var exec   = require('child_process').exec;
var path   = require('path');


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
 * Full version is processed from git information
 *
 * @method getFullVersion
 * @param callback {Function} function to be run when finished, parameter is an object containing base, branch, commit and date fields
 */
function getFullVersion(callback) {
	var fullVersion  = {base: "", branch: "", commit: "", date: ""};
	// get the base version from package.json file
	fullVersion.base = getShortVersion();

	// get to the root folder of the sources
	var dirroot = path.resolve(__dirname, '..');
	// request information from git (at most takes 2 sec.)
	var cmd     = "git log --date=\"short\" --format=\"%d|%h|%ad\" -n 1";
	exec(cmd, { cwd:  dirroot, timeout: 2000}, function(err, stdout, stderr) {
		// if error (not git tree or exec error) return null
		if(err) callback(null);
		
		// parsing the results
		var result = stdout.replace(/\r?\n|\r/g, "");
		var parse = result.split("|");
		var branchList = parse[0].split(",");
		var branch = branchList[branchList.length-1];
		
		// filling up the object
		fullVersion.branch = branch.substring(1, branch.length-1);
		fullVersion.commit = parse[1];
		fullVersion.date   = parse[2].replace(/-/g, "/");
		
		// return the object in the callback paramter
		callback(fullVersion);
	});
}


exports.getShortVersion = getShortVersion;
exports.getFullVersion  = getFullVersion;
