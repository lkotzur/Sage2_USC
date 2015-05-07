// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2014-2015

/**
 * @module client
 * @submodule SAGE2_App
 */

/**
 * Base class for SAGE2 applications
 *
 * @class SAGE2_App
 */
var SAGE2_App = Class.extend( {

	/**
	* Constructor for SAGE2 applications
	*
	* @class SAGE2_App
	* @constructor
	*/
	construct: function() {
		arguments.callee.superClass.construct.call(this);

		this.div          = null;
		this.element      = null;
		this.resrcPath    = null;
		this.moveEvents   = "never";
		this.resizeEvents = "never";
		this.state        = {};

		this.startDate = null;
		this.prevDate  = null;

		this.t     = null;
		this.dt    = null;
		this.frame = null;
		this.fps   = null;

		this.timer  = null;
		this.maxFPS = null;
		this.sticky = null;
		this.config = null;
		this.controls  = null;
		this.cloneable = null;
		// If the clone is not a fresh copy, this variable holds data to be loaded into the clone
		this.cloneData = null;
		this.enableControls  = null;
		this.requestForClone = null;

		// "was visible" state
		this.vis = null;

		//File Handling
		this.id = null;
		this.filePath = null;
		this.fileDataBuffer = null;
		this.fileRead = null;
		this.fileWrite = null;
		this.fileReceived = null;

		// Track if in User Event loop
		this.SAGE2UserModification = false;
		// Modify state sync options
		this.SAGE2StateSyncOptions = {visible: true, hover: null, press: {name: null, value: null}, scroll: 0};
	},

	/**
	* SAGE2Init method called right after the constructor
	*
	* @method SAGE2Init
	* @param type {String} type of DOM element to be created (div, canvas, ...)
	* @param data {Object} contains initialization values (id, width, height, state, ...)
	*/
	SAGE2Init: function(type, data) {
		//App ID
		this.id = data.id;

		this.div = document.getElementById(data.id);
		this.element = document.createElement(type);
		this.element.className = "sageItem";
		this.element.style.zIndex = "0";
		if (type === "div") {
			this.element.style.width  = data.width  + "px";
			this.element.style.height = data.height + "px";
		} else {
			this.element.width  = data.width;
			this.element.height = data.height;
		}
		this.div.appendChild(this.element);

		this.resrcPath = data.resrc + "/";
		this.startDate = data.date;

		// visible
		this.vis = true;

		var parentTransform = getTransform(this.div.parentNode);
		var border = parseInt(this.div.parentNode.style.borderWidth || 0, 10);
		this.sage2_x      = (data.x+border+1)*parentTransform.scale.x + parentTransform.translate.x;
		this.sage2_y      = (data.y+border)*parentTransform.scale.y + parentTransform.translate.y;
		this.sage2_width  = data.width*parentTransform.scale.x;
		this.sage2_height = data.height*parentTransform.scale.y;

		this.sage2_x      = data.x;
		this.sage2_y      = data.y;
		this.sage2_width  = data.width;
		this.sage2_height = data.height;

		this.controls = new SAGE2WidgetControl(data.id);

		this.prevDate  = data.date;
		this.frame     = 0;

		// Measurement variables
		this.frame_sec = 0;
		this.sec       = 0;
		this.fps       = 0.0;

		// Frame rate control
		this.timer     = 0;
		this.maxFPS    = 30.0; // Default to 30fps for performance reasons

		// keep a copy of the wall configuration
		this.config    = ui.json_cfg;

		// Top layer
		this.layer     = null;

		//File Handling
		this.fileName       = "";
		this.fileDataBuffer = null;
		this.fileRead       = false;
		this.fileWrite      = false;
		this.fileReceived   = false;

		this.SAGE2CopyState(data.state);
		this.SAGE2InitializeAppOptionsFromState();
	},

	SAGE2Load: function(state, date) {
		this.SAGE2CopyState(state);
		this.SAGE2UpdateAppOptionsFromState();

		this.load(date);
	},

	SAGE2Event: function(eventType, position, user_id, data, date) {
		if (this.SAGE2StateSyncOptions.visible === true && (eventType === "pointerPress" || eventType === "pointerMove" || eventType === "pointerRelease" || eventType === "pointerScroll" || eventType === "keyboard" || eventType === "specialKey")) {
			var itemIdx = parseInt((position.y-this.SAGE2StateSyncOptions.scroll) / Math.round(1.5*this.config.ui.titleTextSize), 10);
			var children = document.getElementById(this.id + "_statecontainer").childNodes;
			var hoverChild = null;
			var syncedPrev
			var synced;
			if (itemIdx < children.length) {
				hoverChild = children[itemIdx];
			}
			switch (eventType) {
				case "pointerPress":
					if (hoverChild !== null) {
						this.SAGE2StateSyncOptions.press.name = hoverChild;
						this.SAGE2StateSyncOptions.press.value = hoverChild.childNodes[1];
					}
					else {
						this.SAGE2StateSyncOptions.press.name = null;
						this.SAGE2StateSyncOptions.press.value = null;
					}
					break;
				case "pointerMove":
					if (hoverChild !== null) {
						if (this.SAGE2StateSyncOptions.hover !== hoverChild) {
							if (this.SAGE2StateSyncOptions.hover !== null) {
								syncedPrev = this.SAGE2StateSyncOptions.hover.getAttribute("synced");
								synced = (syncedPrev === true || syncedPrev === "true") ? true : false;
								if (synced === true)
									this.SAGE2StateSyncOptions.hover.setAttribute("state", "idle");
								else {
									this.SAGE2StateSyncOptions.hover.setAttribute("state", "unsynced");
								}
							}
							hoverChild.setAttribute("state", "hover");
							this.SAGE2StateSyncOptions.hover = hoverChild;
						}
					}
					else if (this.SAGE2StateSyncOptions.hover !== null) {
						syncedPrev = this.SAGE2StateSyncOptions.hover.getAttribute("synced");
						synced = (syncedPrev === true || syncedPrev === "true") ? true : false;
						if (synced === true)
							this.SAGE2StateSyncOptions.hover.setAttribute("state", "idle");
						else {
							this.SAGE2StateSyncOptions.hover.setAttribute("state", "unsynced");
						}
						this.SAGE2StateSyncOptions.hover = null;
					}
					break;
				case "pointerRelease":
					if (hoverChild === this.SAGE2StateSyncOptions.press.name) {
						var syncedPrev = this.SAGE2StateSyncOptions.press.name.getAttribute("synced");
						var synced = (syncedPrev === true || syncedPrev === "true") ? false : true;
						this.SAGE2StateSyncOptions.press.name.setAttribute("synced", synced);
						if (synced === true) {
							this.SAGE2StateSyncOptions.press.name.setAttribute("state", "idle");
							this.SAGE2StateSyncOptions.press.value.setAttribute("synced", true);
							this.SAGE2StateSyncParent(this.SAGE2StateSyncOptions.press.name, this.SAGE2StateOptions);
							this.SAGE2StateSyncChildren(this.SAGE2StateSyncOptions.press.name, this.SAGE2StateOptions, true);
						}
						else {
							this.SAGE2StateSyncOptions.press.name.setAttribute("state", "unsynced");
							this.SAGE2StateSyncOptions.press.value.setAttribute("synced", false);
							this.SAGE2StateSyncChildren(this.SAGE2StateSyncOptions.press.name, this.SAGE2StateOptions, false);
						}
					}
					this.SAGE2StateSyncOptions.press.name = null;
					this.SAGE2StateSyncOptions.press.value = null;
					break;
				case "pointerScroll":
					var windowStateContatiner = document.getElementById(this.id + "_statecontainer");
					this.SAGE2StateSyncOptions.scroll -= data.wheelDelta;
					var minY = Math.min(this.sage2_height - windowStateContatiner.clientHeight, 0);
					if (this.SAGE2StateSyncOptions.scroll < minY)
						this.SAGE2StateSyncOptions.scroll = minY;
					if (this.SAGE2StateSyncOptions.scroll > 0)
						this.SAGE2StateSyncOptions.scroll = 0;

					var newTransform = "translate(0px," + this.SAGE2StateSyncOptions.scroll + "px)";
					windowStateContatiner.style.webkitTransform = newTransform;
					windowStateContatiner.style.mozTransform = newTransform;
					windowStateContatiner.style.transform = newTransform;
					break;
				case "keyboard":
					break;
				case "specialKey":
					break;
				default:
					break;
			}
		}
		else {
			this.SAGE2UserModification = true;
			this.event(eventType, position, user_id, data, date);
			this.SAGE2UserModification = false;
		}
	},

	/**
	* SAGE2CopyState method called on init or load to copy state of app instance
	*
	* @method SAGE2CopyState
	* @param state {Object} contains state of app instance
	*/
	SAGE2CopyState: function(state) {
		var key;
		for (key in state) {
			this.state[key] = state[key];
		}
	},

	SAGE2InitializeAppOptionsFromState: function() {
		this.SAGE2StateOptions = {};

		var key;
		for (key in this.state) {
			this.SAGE2AddAppOption(key, this.state, 0, this.SAGE2StateOptions);
		}
	},

	SAGE2AddAppOption: function(name, parent, level, save) {
		var windowStateContatiner = document.getElementById(this.id + "_statecontainer");

		var p = document.createElement('p');
		p.style.whiteSpace = "noWrap";
		p.style.fontSize = Math.round(this.config.ui.titleTextSize) + "px";
		p.style.fontFamily = "\"Lucida Console\", Monaco, monospace";
		p.style.marginLeft = Math.round(2*(level+1)*this.config.ui.titleTextSize - this.config.ui.titleTextSize) + "px";
		p.className = "stateObject";
		p.setAttribute("synced", true);
		p.setAttribute("state", "idle");
		p.textContent = name + ": ";

		var s = document.createElement('span');
		s.style.fontSize = Math.round(this.config.ui.titleTextSize) + "px";
		s.style.fontFamily = "\"Lucida Console\", Monaco, monospace";

		p.appendChild(s);
		windowStateContatiner.appendChild(p);

		save[name] = {_name: p, _value: s, _sync: true};

		if (typeof parent[name] === "number") {
			s.className = "stateNumber";
			s.setAttribute("synced", true);
			s.textContent = parent[name].toString();
		}
		else if (typeof parent[name] === "boolean") {
			s.className = "stateBoolean";
			s.setAttribute("synced", true);
			s.textContent = parent[name].toString();
		}
		else if (typeof parent[name] === "string") {
			s.className = "stateString";
			s.setAttribute("synced", true);
			s.textContent = parent[name];
		}
		else if (parent[name] === null) {
			s.className = "stateNull";
			s.setAttribute("synced", true);
			s.textContent = "null";
		}
		else if (parent[name] instanceof Array) {
			s.className = "stateArray";
			s.setAttribute("synced", true);
			s.textContent = "[" + parent[name].join(", ") + "]";
		}
		else if (typeof parent[name] === "object") {
			var key;
			for (key in parent[name]) {
				this.SAGE2AddAppOption(key, parent[name], level+1, save[name]);
			}
		}
	},

	SAGE2UpdateAppOptionsFromState: function() {
		var key;
		for (key in this.state) {
			this.SAGE2UpdateAppOption(key, this.state, this.SAGE2StateOptions);
		}
	},

	SAGE2UpdateAppOption: function(name, parent, save) {
		if (typeof parent[name] === "number") {
			save[name]._value.textContent = parent[name].toString();
		}
		else if (typeof parent[name] === "boolean") {
			save[name]._value.textContent = parent[name].toString();
		}
		else if (typeof parent[name] === "string") {
			save[name]._value.textContent = parent[name];
		}
		else if (parent[name] === null) {
			save[name]._value.textContent = "null";
		}
		else if (parent[name] instanceof Array) {
			save[name]._value.textContent = "[" + parent[name].join(", ") + "]";
		}
		else if (typeof parent[name] === "object") {
			var key;
			for (key in parent[name]) {
				this.SAGE2UpdateAppOption(key, parent[name], save[name]);
			}
		}
	},

	SAGE2StateSyncParent: function(node, parent) {
		var key;
		for (key in parent) {
			if (parent.hasOwnProperty(key) && key[0] !== "_") {
				if (parent[key]._name === node) {
					if (parent !== this.SAGE2StateOptions) {
						parent._name.setAttribute("state", "idle");
						parent._name.setAttribute("synced", true);
						parent._value.setAttribute("synced", true);
						parent._sync = true;
						this.SAGE2StateSyncParent(parent._name, this.SAGE2StateOptions);
					}
					break;
				}
				else {
					this.SAGE2StateSyncParent(node, parent[key]);
				}
			}
		}
	},

	SAGE2StateSyncChildren: function(node, parent, flag) {
		var key;
		for (key in parent) {
			if (parent.hasOwnProperty(key) && key[0] !== "_") {
				if (parent[key]._name === node) {
					this.SAGE2StateSyncChildrenHelper(parent[key], flag);
					break;
				}
				else {
					this.SAGE2StateSyncChildren(node, parent[key], flag);
				}
			}
		}
	},

	SAGE2StateSyncChildrenHelper: function(parent, flag) {
		if (flag === true) {
			parent._name.setAttribute("state", "idle");
		}
		else {
			parent._name.setAttribute("state", "unsynced");
		}
		parent._name.setAttribute("synced", flag);
		parent._value.setAttribute("synced", flag);
		parent._sync = flag;

		var key;
		for (key in parent) {
			if (parent.hasOwnProperty(key) && key[0] !== "_") {
				this.SAGE2StateSyncChildrenHelper(parent[key], flag);
			}
		}
	},

	SAGE2Sync: function(updateRemote) {
		this.SAGE2UpdateAppOptionsFromState();
		
		if(isMaster)
			wsio.emit('updateAppState', {id: this.id, state: this.state, updateRemote: updateRemote});
	},

	/**
	* Method to create a layered div ontop the application
	*
	* @method createLayer
	* @param backgroundColor {String} color in DOM-syntax for the div
	*/
	createLayer: function(backgroundColor) {
		this.layer = document.createElement('div');
		this.layer.style.backgroundColor  = backgroundColor;
		this.layer.style.position = "absolute";
		this.layer.style.padding  = "0px";
		this.layer.style.margin   = "0px";
		this.layer.style.left     = "0px";
		this.layer.style.top      = "0px";
		this.layer.style.width    = "100%";
		this.layer.style.color    = "#FFFFFF";
		this.layer.style.display  = "none";
		this.layer.style.overflow = "visible";
		this.layer.style.zIndex   = parseInt(this.div.zIndex)+1;
		this.layer.style.fontSize = Math.round(this.config.ui.titleTextSize) + "px";

		this.div.appendChild(this.layer);

		return this.layer;
	},

	/**
	* Method to display the layer
	*
	* @method showLayer
	*/
	showLayer: function() {
		if (this.layer) {
			// Reset its top position, just in case
			this.layer.style.top = "0px";
			this.layer.style.display = "block";
		}
	},

	/**
	* Method to hide the layer
	*
	* @method hideLayer
	*/
	hideLayer: function () {
		if (this.layer) {
			this.layer.style.display = "none";
		}
	},

	/**
	* Method to flip the visibility of the layer
	*
	* @method showHideLayer
	*/
	showHideLayer: function () {
		if (this.layer) {
			if (this.isLayerHidden()) this.showLayer();
			else this.hideLayer();
		}
	},

	/**
	* Method returning the visibility of the layer
	*
	* @method isLayerHidden
	* @return {Bool} true if layer is hidden
	*/
	isLayerHidden: function () {
		if (this.layer)	return (this.layer.style.display === "none");
		else return false;
	},

	/**
	* Calculate if the application is hidden in this display
	*
	* @method isHidden
	* @return {Boolean} Returns true if out of screen
	*/
	isHidden: function() {
		var checkWidth  = this.config.resolution.width;
		var checkHeight = this.config.resolution.height;
		if (clientID===-1) {
			// set the resolution to be the whole display wall
			checkWidth  *= this.config.layout.columns;
			checkHeight *= this.config.layout.rows;
		}
		return (this.sage2_x > (ui.offsetX + checkWidth)  ||
				(this.sage2_x + this.sage2_width) < ui.offsetX ||
				this.sage2_y > (ui.offsetY + checkHeight) ||
				(this.sage2_y + this.sage2_height) < ui.offsetY);
	},

	/**
	* Calculate if the application is visible in this display
	*
	* @method isVisible
	* @return {Boolean} Returns true if visible
	*/
	isVisible: function() {
		return !this.isHidden();
	},

	/**
	* Method called before the draw function, calculates timing and frame rate
	*
	* @method preDraw
	* @param date {Date} current time from the server
	*/
	preDraw: function(date) {
		// total time since start of program (sec)
		this.t  = (date.getTime() - this.startDate.getTime()) / 1000;
		// delta time since last frame (sec)
		this.dt = (date.getTime() -  this.prevDate.getTime()) / 1000;

		// Frame rate control
		this.timer += this.dt;
		if (this.timer > (1.0/this.maxFPS)) {
			this.timer  = 0.0;
		}

		// Check for visibility
		var visible = this.isVisible();
		if (!visible && this.vis) {
			// trigger the app visibility callback, if there's one
			if (this.onVisible) this.onVisible(false);
			// app became hidden
			this.vis = false;
		}
		if (visible && !this.vis) {
			// trigger the visibility callback, if there's one
			if (this.onVisible) this.onVisible(true);
			// app became visible
			this.vis = true;
		}

		// Increase time
		this.sec += this.dt;
	},

	/**
	* Method called after the draw function
	*
	* @method postDraw
	* @param date {Date} current time from the server
	*/
	postDraw: function(date) {
		this.prevDate = date;
		this.frame++;
	},

	/**
	* Internal method for an actual draw loop (predraw, draw, postdraw).
	*  draw is called as needed
	*
	* @method refresh
	* @param date {Date} current time from the server
	*/
	refresh: function (date) {
		if (this.SAGE2UserModification === true) {
			this.SAGE2Sync(true);
		}

		// update time
		this.preDraw(date);
		// measure actual frame rate
		if( this.sec >= 1.0){
			this.fps       = this.frame_sec / this.sec;
			this.frame_sec = 0;
			this.sec       = 0;
		}
		// actual application draw
		this.draw(date);
		this.frame_sec++;
		// update time and misc
		this.postDraw(date);
	},

	/**
	* Method called by SAGE2, and calls the application 'quit' method
	*
	* @method terminate
	*/
	terminate: function () {
		if (typeof this.quit === 'function' ) {
			this.quit();
		}
	},

	/**
	* Application request for a new size
	*
	* @method sendResize
	* @param newWidth {Number} desired width
	* @param newHeight {Number} desired height
	*/
	sendResize: function (newWidth, newHeight) {
		var msgObject = {};
		// Add the display node ID to the message
		msgObject.node   = clientID;
		msgObject.id     = this.div.id;
		msgObject.width  = newWidth;
		msgObject.height = newHeight;
		// Send the message to the server
		wsio.emit('appResize', msgObject);
	},

	/**
	* RPC to every application client (client-side)
	*
	* @method broadcast
	* @param funcName {String} name of the function to be called in each client
	* @param data {Object} parameters to the function call
	*/
	broadcast: function (funcName, data) {
		broadcast({app: this.div.id, func: funcName, data: data});
	},

	/**
	* Support for the Tweet application
	*
	* @method searchTweets
	* @param funcName {String} function name for broadcast or emit
	* @param query {Object} search info for tweet API
	* @param broadcast {Boolean} wether or not doing a return broadcast or emit
	*/
	searchTweets: function(funcName, query, broadcast) {
		searchTweets({app: this.div.id, func: funcName, query: query, broadcast: broadcast});
	},

	/**
	* Prints message to local browser console and send to server.
	*  Accept a string as parameter or multiple parameters
	*
	* @method log
	* @param msg {Object} list of arguments to be printed
	*/
	log: function(msg) {
		if (arguments.length===0) return;
		var args;
		if (arguments.length > 1)
			args = Array.prototype.slice.call(arguments);
		else
			args = msg;
		sage2Log({app: this.div.id, message: args});
	}
});
