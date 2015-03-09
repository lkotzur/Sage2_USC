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
 * @module media_block_stream
 */

/**
 * Class for media block streaming applications, inherits from SAGE2_BlockStreamingApp
 *
 * @class media_block_stream
 */
var media_block_stream = SAGE2_BlockStreamingApp.extend( {
	/**
	* Constructor
	*
	* @class media_block_stream
	* @constructor
	*/
	construct: function() {
		arguments.callee.superClass.construct.call(this);
	},

	/**
	* Init method, creates a 'div' tag in the DOM
	*
	* @method init
	* @param data {Object} contains initialization values (id, width, height, ...)
	*/
	init: function(data) {
		// call super-class 'init'
		arguments.callee.superClass.init.call(this, "div", data);
	},

	/**
	* Loads the app from a previous state
	*
	* @method load
	* @param state {Object} object to initialize or restore the app
	* @param date {Date} time from the server
	*/
	load: function(state, date) {
		arguments.callee.superClass.load.call(this, state, date);
	}

});