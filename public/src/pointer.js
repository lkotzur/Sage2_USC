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
 * @module Pointer
 */

/**
 * Graphical representation of a pointer, using Snap.svg and SVG
 *
 * @class Pointer
 * @constructor
 */
function Pointer() {
	// Variable definitions
	this.div                = null;
	this.snap               = null;
	this.pointerIcon        = null;
	this.pointerIconLoaded  = null;
	this.appModeIcon        = null;
	this.appModeIconLoaded  = null;
	this.winModeIcon        = null;
	this.winModeIconLoaded  = null;
	this.labelBG            = null;
	this.labelText          = null;
	this.color              = null;
	this.sourceType         = null;

	/**
	* Init method, creates a div to attach Snap rendering into it
	*
	* @method init
	* @param id {String} id of the div supporting the pointer
	* @param label {String} label for the username
	* @param color {String} color for the pointer
	* @param width {Number} width in pixel
	* @param height {Number} height in pixel
	*/
	this.init = function(id, label, color, width, height) {
		this.div  = document.getElementById(id);
		this.snap = new Snap(width, height);
		this.div.appendChild(this.snap.node);

		this.color = color;
		this.mode  = 0;

		var pointerIconSize    = height * 0.65;
		var pointerIconX       = height * 0.25;
		var pointerIconY       = height * 0.20;
		this.pointerIconLoaded = false;

		var winModeIconSize    = height * 0.330;
		var winModeIconX       = height * 0.0925;
		var winModeIconY       = height * 0.044167;
		this.winModeIconLoaded = false;

		var appModeIconSize    = height * 0.330;
		var appModeIconX       = height * 0.0925;
		var appModeIconY       = height * 0.044167;
		this.appModeIconLoaded = false;

		var labelBGX = height * 0.40;
		var labelBGY = height * 0.65;
		var labelBGWidth  = height * 1.00;
		var labelBGHeight = height * 0.275;
		var labelTextX    = height * 0.5425;
		var labelTextY    = height * 0.8475;
		var labelTextSize = Math.round(0.17*height);

		var _this = this;

		Snap.load("images/SAGE2 Pointer Arrow.svg", function(f) {
			_this.pointerIcon = f.select("svg");
			_this.pointerIcon.attr({
				id: "pointerIcon",
				x: pointerIconX,
				y: pointerIconY,
				width: pointerIconSize,
				height: pointerIconSize,
				preserveAspectRatio: "xMinYMin meet"
			});
			// add the loaded element into the SVG graph
			_this.snap.append(_this.pointerIcon);
			// mark it as loaded
			_this.pointerIconLoaded = true;
			// if both icons loaded, update colors
			if(_this.winModeIconLoaded === true && _this.appModeIconLoaded)
				_this.updateIconColors();
		});

		Snap.load("images/SAGE2 Window Manipulation.svg", function(f) {
			_this.winModeIcon = f.select("svg");
			_this.winModeIcon.attr({
				id: "winModeIcon",
				x: winModeIconX,
				y: winModeIconY,
				width: winModeIconSize,
				height: winModeIconSize,
				preserveAspectRatio: "xMinYMin meet"
			});
			// add the loaded element into the SVG graph
			_this.snap.prepend(_this.winModeIcon);
			// mark it as loaded
			_this.winModeIconLoaded = true;
			// if both icons loaded, update colors
			if (_this.pointerIconLoaded === true && _this.appModeIconLoaded === true)
				_this.updateIconColors();
		});

		Snap.load("images/SAGE2 Application Interaction.svg", function(f) {
			_this.appModeIcon = f.select("svg");
			_this.appModeIcon.attr({
				id: "appModeIcon",
				x: appModeIconX,
				y: appModeIconY,
				width: appModeIconSize,
				height: appModeIconSize,
				preserveAspectRatio: "xMinYMin meet"
			});

			_this.snap.prepend(_this.appModeIcon);

			_this.appModeIconLoaded = true;
			if(_this.pointerIconLoaded === true && _this.winModeIconLoaded === true)
				_this.updateIconColors();
		});

		this.labelBG = this.snap.rect(labelBGX, labelBGY, labelBGWidth, labelBGHeight, labelBGHeight/2, labelBGHeight/2).attr({
			fill: "rgba(0, 0, 0, 0.6)"
		});

		this.labelText = this.snap.text(labelTextX, labelTextY, label).attr({
			fill: "#FFFFFF",
			fontSize: labelTextSize + "px",
			fontFamily: "Verdana,Arial,Helvetica"
		});

		this.labelBG.attr({width: this.labelText.node.clientWidth + labelBGHeight});
	};

	/**
	* Change the color of the pointer
	*
	* @method setColor
	* @param color {String} color for the pointer
	*/
	this.setColor = function(color) {
		this.color = color;
		this.updateIconColors();
	};

	/**
	* Change the label of the pointer (user name)
	*
	* @method setLabel
	* @param label {String} label for the username
	*/
	this.setLabel = function(label) {
		var labelBGHeight = this.snap.node.clientHeight * 0.275;
		this.labelText.attr({text: label});
		this.labelBG.attr({width: this.labelText.node.clientWidth + labelBGHeight});
	};

	/**
	* Change the type of pointer: touch, mouse, ...
	*
	* @method setSourceType
	* @param type {String} new type of pointer
	*/
	this.setSourceType = function(type) {
		this.sourceType = type;
		this.updateIconColors();
	};

	/**
	* Switch between window manipulation and application interaction
	*
	* @method changeMode
	* @param mode {Number} new pointer mode: 0 window manipulation, 1 application interaction
	*/
	this.changeMode = function(mode) {
		this.mode = mode;
		this.updateIconColors();
	};

	/**
	* Update the colors based on mode and type
	*
	* @method updateIconColors
	*/
	this.updateIconColors = function() {
		if( this.sourceType === "Touch" ) {
			if (this.pointerIconLoaded) this.colorSVG(this.pointerIcon, "#000000", this.color);
			if (this.winModeIconLoaded) this.colorSVG(this.winModeIcon, "#000000", "#FFFFFF");
			if (this.appModeIconLoaded) this.colorSVG(this.appModeIcon, "#000000", "#FFFFFF");

			// window manipulation
			if (this.mode === 0) {
				if (this.pointerIconLoaded) this.pointerIcon.attr({display: "none"});
				if (this.winModeIconLoaded) this.winModeIcon.attr({display: "none"});
				if (this.appModeIconLoaded) this.appModeIcon.attr({display: ""});

				this.labelText.attr({display: "none"});
				this.labelBG.attr({display: "none"});
			}
			// application interaction
			else if(this.mode === 1) {
				if (this.winModeIconLoaded) this.winModeIcon.attr({display: "none"});
				if (this.appModeIconLoaded) this.appModeIcon.attr({display: ""});
			}
		}
		else {
			if (this.pointerIconLoaded) this.colorSVG(this.pointerIcon, "#000000", this.color);
			if (this.winModeIconLoaded) this.colorSVG(this.winModeIcon, "#000000", "#FFFFFF");
			if (this.appModeIconLoaded) this.colorSVG(this.appModeIcon, "#000000", "#FFFFFF");

			// window manipulation
			if (this.mode === 0) {
				if (this.winModeIconLoaded) this.winModeIcon.attr({display: "none"});
				if (this.appModeIconLoaded) this.appModeIcon.attr({display: "none"});
			}
			// application interaction
			else if(this.mode === 1) {
				if (this.winModeIconLoaded) this.winModeIcon.attr({display: "none"});
				if (this.appModeIconLoaded) this.appModeIcon.attr({display: ""});
			}
		}
	};

	/**
	* Utility function to modify the color of SVG elememts
	*
	* @method colorSVG
	* @param svg {Object} svg element
	* @param stroke {Object} stroke color
	* @param fill {Object} fill color
	*/
	this.colorSVG = function(svg, stroke, fill) {
		var rects    = svg.selectAll("rect");
		if (rects) rects.attr({fill: fill, stroke: stroke});
		var circles  = svg.selectAll("circle");
		if (circles) circles.attr({fill: fill, stroke: stroke});
		var ellipses = svg.selectAll("ellipse");
		if (ellipses) ellipses.attr({fill: fill, stroke: stroke});
		var polygons = svg.selectAll("polygon");
		if (polygons) polygons.attr({fill: fill, stroke: stroke});
		var paths    = svg.selectAll("path");
		if (paths) paths.attr({fill: fill, stroke: stroke});
	};

}