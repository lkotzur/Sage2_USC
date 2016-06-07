// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2014

"use strict";

/* global google */

var googlemaps = SAGE2_App.extend({
	init: function(data) {
		this.SAGE2Init("div", data);
		this.element.id = "div" + this.id;

		this.resizeEvents = "continuous"; // "onfinish";

		this.map          = null;
		this.dragging     = false;
		this.position     = {x: 0, y: 0};
		this.scrollAmount = 0;
		this.trafficTimer = null;
		this.isShift      = false;

		// Create a callback function for traffic updates
		this.trafficCB = this.reloadTiles.bind(this);
		// Create a callback func for checking if Google Maps API is loaded yet
		this.initializeOnceMapsLoadedFunc = this.initializeOnceMapsLoaded.bind(this);

		this.initializeWidgets();
		this.initializeOnceMapsLoaded();
	},

	initializeWidgets: function() {
		this.controls.addButton({label: "Map", position: 4, identifier: "Map"});
		this.controls.addButton({type: "traffic", position: 3, identifier: "Traffic"});
		this.controls.addButton({type: "zoom-in", position: 12, identifier: "ZoomIn"});
		this.controls.addButton({type: "zoom-out", position: 11, identifier: "ZoomOut"});
		this.controls.addTextInput({value: "", label: "Addr", identifier: "Address"});

		this.controls.addSlider({
			identifier: "Zoom",
			minimum: 0,
			maximum: 20,
			increments: 1,
			property: "this.state.zoomLevel",
			label: "Zoom",
			labelFormatFunction: function(value, end) {
				return ((value < 10) ? "0" : "") + value + "/" + end;
			}
		});

		this.controls.finishedAddingControls();
	},

	initializeOnceMapsLoaded: function() {
		if (window.google === undefined || google.maps === undefined || google.maps.Map === undefined) {
			setTimeout(this.initializeOnceMapsLoadedFunc, 40);
		} else {
			this.initialize();
		}
	},

	initialize: function() {
		google.maps.visualRefresh = true;
		this.geocoder = new google.maps.Geocoder();
		var city = new google.maps.LatLng(this.state.center.lat, this.state.center.lng);
		var mapOptions = {
			center: city,
			zoom: this.state.zoomLevel,
			mapTypeId: this.state.mapType,
			disableDefaultUI: true,
			zoomControl: false,
			scaleControl: false,
			scrollwheel: false
		};
		this.map = new google.maps.Map(this.element, mapOptions);
		this.map.setTilt(45);

		// Extra layers
		this.trafficLayer = new google.maps.TrafficLayer();

		if (this.state.layer.t === true) {
			this.trafficLayer.setMap(this.map);
			// add a timer updating the traffic tiles: 60sec
			this.trafficTimer = setInterval(this.trafficCB, 60 * 1000);
		}
	},

	updateMapFromState: function() {
		var city = new google.maps.LatLng(this.state.center.lat, this.state.center.lng);
		var mapOptions = {
			center: city,
			zoom: this.state.zoomLevel,
			mapTypeId: this.state.mapType,
			disableDefaultUI: true,
			zoomControl: false,
			scaleControl: false,
			scrollwheel: false
		};
		this.map.setOptions(mapOptions);

		// traffic layer
		if (this.state.layer.t === true) {
			this.trafficLayer.setMap(this.map);
			// add a timer updating the traffic tiles: 60sec
			this.trafficTimer = setInterval(this.trafficCB, 60 * 1000);
		} else {
			this.trafficLayer.setMap(null);
			// remove the timer updating the traffic tiles
			clearInterval(this.trafficTimer);
		}

		this.updateLayers();
	},

	load: function(date) {
		if (this.map !== undefined && this.map !== null) {
			this.updateMapFromState();
			this.refresh(date);
		}
	},

	draw: function(date) {
	},

	resize: function(date) {
		google.maps.event.trigger(this.map, 'resize');
		this.refresh(date);
	},

	updateCenter: function() {
		var c = this.map.getCenter();
		this.state.center = {lat: c.lat(), lng: c.lng()};
	},

	updateLayers: function() {
		// to trigger an 'oberve' event, need to rebuild the layer field
		this.state.layer = {t: this.trafficLayer.getMap() != null};
	},

	reloadTiles: function() {
		// Get the image tiles in the maps
		var tiles = this.element.getElementsByTagName('img');
		for (var i = 0; i < tiles.length; i++) {
			// get the URL
			var src = tiles[i].src;
			if (/googleapis.com\/maps\/vt\?pb=/.test(src)) {
				// add a date inthe URL will trigger a reload
				var new_src = src.split("&ts")[0] + '&ts=' + (new Date()).getTime();
				tiles[i].src = new_src;
			}
		}
	},

	quit: function() {
		// Make sure to delete the timer when quitting the app
		if (this.trafficTimer) {
			clearInterval(this.trafficTimer);
		}
	},

	event: function(eventType, position, user_id, data, date) {
		var z;

		if (eventType === "pointerPress" && (data.button === "left")) {
			this.dragging = true;
			this.position.x = position.x;
			this.position.y = position.y;

			this.refresh(date);
		} else if (eventType === "pointerMove" && this.dragging) {
			this.map.panBy(this.position.x - position.x, this.position.y - position.y);
			this.updateCenter();
			this.position.x = position.x;
			this.position.y = position.y;

			this.refresh(date);
		} else if (eventType === "pointerRelease" && (data.button === "left")) {
			this.dragging = false;
			this.position.x = position.x;
			this.position.y = position.y;

			this.refresh(date);
		} else if (eventType === "pointerDblClick") {
			// Double click to zoom in, with shift to zoom out
			if (this.isShift) {
				this.relativeZoom(-1);
			} else {
				this.relativeZoom(1);
			}
		} else if (eventType === "pointerScroll") {
			// Scroll events for zoom
			this.scrollAmount += data.wheelDelta;

			if (this.scrollAmount >= 64) {
				// zoom out
				z = this.map.getZoom();
				this.map.setZoom(z - 1);
				this.state.zoomLevel = this.map.getZoom();
				this.lastZoom = date;

				this.scrollAmount -= 64;
			} else if (this.scrollAmount <= -64) {
				// zoom in
				z = this.map.getZoom();
				this.map.setZoom(z + 1);
				this.state.zoomLevel = this.map.getZoom();
				this.lastZoom = date;

				this.scrollAmount += 64;
			}

			this.refresh(date);
		} else if (eventType === "widgetEvent") {
			switch (data.identifier) {
				case "Map":
					this.changeMapType();
					break;
				case "Traffic":
					this.toggleTraffic();
					break;
				case "ZoomIn":
					this.relativeZoom(1);
					break;
				case "ZoomOut":
					this.relativeZoom(-1);
					break;
				case "Zoom":
					switch (data.action) {
						case "sliderLock":
							break;
						case "sliderUpdate":
							break;
						case "sliderRelease":
							this.map.setZoom(this.state.zoomLevel);
							break;
						default:
							console.log("No handler for: " + data.identifier + "->" + data.action);
							break;
					}
					break;
				case "Address":
					// Async call to geocoder (will sync the state)
					this.codeAddress(data.text);
					// Setting the zoom
					this.map.setZoom(15);
					this.state.zoomLevel = 15;
					break;
				default:
					console.log("No handler for:", data.identifier);
			}
			this.refresh(date);
		} else if (eventType === "keyboard") {
			if (data.character === "m") {
				// change map type
				this.changeMapType();
			} else if (data.character === "t") {
				this.toggleTraffic();
			}
			// else if (data.character === 'x') {
			// 	// Press 'x' to close itself
			// 	this.close();
			// }
			this.refresh(date);
		} else if (eventType === "specialKey") {
			if (data.code === 16) {
				// Shift key
				this.isShift = (data.state === "down");
			}
			if (data.code === 18 && data.state === "down") {      // alt
				// zoom in
				this.relativeZoom(1);
			} else if (data.code === 17 && data.state === "down") { // control
				// zoom out
				this.relativeZoom(-1);
			} else if (data.code === 37 && data.state === "down") { // left
				this.map.panBy(-100, 0);
				this.updateCenter();
			} else if (data.code === 38 && data.state === "down") { // up
				this.map.panBy(0, -100);
				this.updateCenter();
			} else if (data.code === 39 && data.state === "down") { // right
				this.map.panBy(100, 0);
				this.updateCenter();
			} else if (data.code === 40 && data.state === "down") { // down
				this.map.panBy(0, 100);
				this.updateCenter();
			}

			this.refresh(date);
		}
	},

	changeMapType: function() {
		if (this.state.mapType === google.maps.MapTypeId.TERRAIN) {
			this.state.mapType = google.maps.MapTypeId.ROADMAP;
		} else if (this.state.mapType === google.maps.MapTypeId.ROADMAP) {
			this.state.mapType = google.maps.MapTypeId.SATELLITE;
		} else if (this.state.mapType === google.maps.MapTypeId.SATELLITE) {
			this.state.mapType = google.maps.MapTypeId.HYBRID;
		} else if (this.state.mapType === google.maps.MapTypeId.HYBRID) {
			this.state.mapType = google.maps.MapTypeId.TERRAIN;
		} else {
			this.state.mapType = google.maps.MapTypeId.HYBRID;
		}
		this.map.setMapTypeId(this.state.mapType);
	},

	toggleTraffic: function() {
		// add/remove traffic layer
		if (this.trafficLayer.getMap() == null) {
			this.trafficLayer.setMap(this.map);
			// add a timer updating the traffic tiles: 60sec
			this.trafficTimer = setInterval(this.trafficCB, 60 * 1000);
		} else {
			this.trafficLayer.setMap(null);
			// remove the timer updating the traffic tiles
			clearInterval(this.trafficTimer);
		}
		this.updateLayers();
	},

	relativeZoom: function(delta) {
		delta = parseInt(delta);
		delta = (delta > -1) ? 1 : -1;
		var z = this.map.getZoom();
		this.map.setZoom(z + delta);
		this.state.zoomLevel = this.map.getZoom();
	},

	codeAddress: function(text) {
		this.geocoder.geocode({address: text}, function(results, status) {
			if (status === google.maps.GeocoderStatus.OK) {
				var res = results[0].geometry.location;
				// Update the map with the result
				this.map.setCenter(res);
				// Update the state variable
				this.state.center = {lat: res.lat(), lng: res.lng()};
				// Need to sync since it's an async function
				this.SAGE2Sync(true);
			} else {
				console.log('Geocode was not successful for the following reason: ' + status);
			}
		}.bind(this));
	},

	/**
	* To enable right click context menu support this function needs to be present.
	*
	* Must return an array of entries. An entry is an object with three properties:
	*	description: what is to be displayed to the viewer.
	*	callback: String containing the name of the function to activate in the app. It must exist.
	*	parameters: an object with specified datafields to be given to the function.
	*		The following attributes will be automatically added by server.
	*			serverDate, on the return back, server will fill this with time object.
	*			clientId, unique identifier (ip and port) for the client that selected entry.
	*			clientName, the name input for their pointer. Note: users are not required to do so.
	*			clientInput, if entry is marked as input, the value will be in this property. See pdf_viewer.js for example.
	*		Further parameters can be added. See pdf_view.js for example.
	*/
	getContextEntries: function() {
		var entries = [];
		var entry   = {};
		// label of them menu
		entry.description = "Type a location:";
		// callback
		entry.callback = "setLocation";
		// parameters of the callback function
		entry.parameters     = {};
		entry.inputField     = true;
		entry.inputFieldSize = 20;
		entries.push(entry);

		return entries;
	},

	/**
	 * Callback from th web ui menu (right click)
	*/
	setLocation: function(msgParams) {
		// receive an from the web ui
		// .clientInput for what they typed
		this.codeAddress(msgParams.clientInput);
	}

});
