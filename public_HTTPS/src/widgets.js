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
 * Widget Controls and helper functionality for custom application user interface
 *
 * @class SAGE2WidgetControls, SAGE2WidgetControlBar
 */


var SAGE2WidgetControls = {
	button: function () {
		this.appId = null;
		this.id    = null;
		this.type  = null;
		this.call  = null;
	},
	slider: function() {
		this.id = null;
		this.appId = null;
		this.begin = null;
		this.end = null;
		this.increments = null;
		this.parts = null;
		this.call = null;
		this.appHandle = null;
		this.appProperty = null;
		this.sliderVal = null;
	},
	textInput: function() {
		this.id    = null;
		this.appId = null;
		this.width = null;
	},
	label: function() {
		this.id     = null;
		this.appHandle = null;
		this.appId  = null;
		this.width  = null;
		this.appProperty = null;
	}

}
var buttonType = {
	"play-pause": {
		"from":"m -5 -5 l 0 10 l 6 -3 l 4 -2 z",
		"to":"m -2 -5 l 0 10 m 4 0 l 0 -10",
		"width":10,
		"height":12,
		"strokeWidth": 1,
		"fill":"#ffffff",
		"switch": 0,
		"delay": 400
	},
	"play-stop": {
		"from":"m -5 -5 l 0 10 l 6 -3 l 4 -2 z",
		"to":"m -5 -5 l 0 10 l 10 0 l 0 -10 z",
		"width":10,
		"height":12,
		"strokeWidth": 1,
		"fill":"#ffffff",
		"switch": 0,
		"delay": 400
	},
	"next": {
		"switch": null,
		"from":"m 0 -6 l 4 6 l -4 6",
		"to":"m -6 0 l 10 0 l -10 0",//"m -3 0 a 6 6 180 1 0 0 1 z",
		"width":10,
		"height":12,
		"fill":"none",
		"strokeWidth": 1,
		"delay": 600
	},
	"prev": {
		"switch": null,
		"from":"m 0 -6 l -4 6 l 4 6",
		"to":"m 6 0 l -10 0 l 10 0",
		"width":10,
		"height":12,
		"fill":"none",
		"strokeWidth": 1,
		"delay":600

	},
	"next-zoom": {
		"switch": null,
		"from":"m 0 -6 l 4 6 l -4 6",
		"to":"m -2 -9 l 8 9 l -10 9",
		"width":10,
		"height":12,
		"fill":"none",
		"strokeWidth": 1,
		"delay": 600
	},
	"prev-zoom": {
		"switch": null,
		"from":"m 0 -6 l -4 6 l 4 6",
		"to":"m -2 -9 l -8 9 l 10 9",
		"width":10,
		"height":12,
		"fill":"none",
		"strokeWidth": 1,
		"delay":600
	},
	"rewind": {
		"switch": null,
		"from":"m 0 -6 l -4 6 l 4 6 m 4 -12 l -4 6 l 4 6",
		"to":"m 0 -6 l -4 6 l 4 6 m 6 -6 l -10 0 l 10 0",
		"width":10,
		"height":12,
		"fill":"none",
		"strokeWidth": 1,
		"delay":600
	},
	"fastforward": {
		"switch": null,
		"from":"m 0 -6 l 4 6 l -4 6 m -4 -12 l 4 6 l -4 6",
		"to":"m 0 -6 l 4 6 l -4 6 m -6 -6 l 10 0 l -10 0 ",
		"width":10,
		"height":12,
		"fill":"none",
		"strokeWidth": 1,
		"delay":600
	},
	"duplicate": {
		"switch": null,
		"from":"m -4 -5 l 8 0 l 0 10 l -8 0 z",
		"to":"m -4 -5 l 8 0 l 0 10 l -8 0 z m 3 0 l 0 -3 l 8 0 l 0 10 l -3 0",
		"width":10,
		"height":12,
		"fill":"#999999",
		"strokeWidth": 1,
		"delay":600
	}

};

/**
*	Represents the widget bar
* 	Has functions to create elements of the widget bar 
*/
function SAGE2WidgetControlBar(id) {
	this.id = id;
	this.specReady = false;
	this.itemCount = 0;
	this.items = [];
	this.buttonGroups = [];
	this.buttonGroupIdx = -1;
	this.hasSlider = false;
	this.hasTextInput = false;
	this.buttonType = buttonType;
	this.layoutOptions = {
		"drawGroupBoundaries":false,
		"drawBackground": true,
		"shape": "radial",
		"drawSpokes": true,
		"drawSquareButtons":false
	};

	this.controlSVG = null;
}

/**
*	Ensures everything got added to the controls specification properly
*/
SAGE2WidgetControlBar.prototype.finishedAddingControls = function(){
	this.specReady = true;
}

/**
*	Check whether control specification is ready (used before creating widget elements from specification)
*/
SAGE2WidgetControlBar.prototype.controlsReady = function(){
	return this.specReady;
}

/**
*	Adds a new button group 
*	A total of three groups can be added
*	Each group can hold upto three buttons
*/
SAGE2WidgetControlBar.prototype.addButtonGroup = function(){
	if (this.buttonGroupIdx < 4){
		this.buttonGroupIdx = this.buttonGroupIdx+1;
		this.buttonGroups[this.buttonGroupIdx] = [];
	}
}

/**
*	Lets the user add a custom cover for buttons
* 	Added cover is available only to that instance of that app. 
*/
SAGE2WidgetControlBar.prototype.addButtonType = function(type, buttonData){
	if (this.buttonType[type] === undefined || this.buttonType[type] === null){
		this.buttonType[type] = buttonData;
	}
}

/**
*	
* 	Allows the user to modify the look of the widget control bar
*	layoutOptions
*		.shape - "radial" (only one option for now, will add more soon)
		.drawBackground - true/false (if set to true, displays the semi transparent background)
		.drawGroupBoundaries - true/false (if set to true, displays the sector like boundaries around button groups)
		.drawSpokes - true/false (if set to true, displays the spokes from center to each widget element)
		.drawSquareButton - true/false (Not yet implemented)
*/
SAGE2WidgetControlBar.prototype.setLayoutOptions = function(layoutOptions){
	if (layoutOptions.drawBackground) this.layoutOptions.drawBackground = layoutOptions.drawBackground;
	if (layoutOptions.drawGroupBoundaries && layout.drawBackground === false) this.layoutOptions.drawGroupBoundaries = layoutOptions.drawGroupBoundaries;
	if (layoutOptions.shape) this.layoutOptions.shape = layoutOptions.shape;
	if (layoutOptions.drawSpokes) this.layoutOptions.drawSpokes = layoutOptions.drawSpokes;
	if (layoutOptions.drawSquareButtons) this.layoutOptions.drawSquareButtons = layoutOptions.drawSquareButtons;
}

/**
*	Adds a button specification 
*	data
*		.type - one of the several predefined button(cover) types [ex: "next", "prev", and so on]
*		.action - callback function to specify action after the button has been pressed
*	action callabck looks like this:
*	function (appHandle, date){
*		//use the appHandle to perform button click related action here	
*	}
*/
SAGE2WidgetControlBar.prototype.addButton = function(data) {
	if (this.buttonGroupIdx < 4 && this.buttonGroupIdx > -1 && this.buttonGroups[this.buttonGroupIdx].length <= 3){
		var button = new SAGE2WidgetControls.button();
		button.appId = this.id;
		button.id = "button" + this.itemCount;
		button.type = data.type;
		button.call = data.action || null;
		button.width = 1.5*ui.widgetControlSize;
		this.items.push(button);
		this.buttonGroups[this.buttonGroupIdx].push(button);
		this.itemCount++;
	}
};

/**
*	Adds a text-input bar specification 
*	data
*		.action - callback function to specify action after the text has been input and enter key pressed
*	action callabck looks like this:
*	function (appHandle, text){
*		// text contains the string from the text-input widget
*		// use the appHandle to send text to the app	
*	}
*/
SAGE2WidgetControlBar.prototype.addTextInput = function (data) {
	if (this.hasTextInput === false){
		this.hasTextInput = true;
		var textInput = new SAGE2WidgetControls.textInput();
		textInput.id = "textInput" + this.itemCount;
		textInput.appId = this.id;
		textInput.width = 12.0*ui.widgetControlSize;
		textInput.call = data.action || null;
		this.textInput = textInput;
		this.items.push(textInput);
		this.itemCount++;
	}
	
};

/**
*	Adds a slider specification 
*	data
*		.appHandle 
*		.property - appHandle and preperty are used to bind a property of the app to the slider
*		for example, if you want to bind this.state.currentPage to the slider, then send appHandle:this, property:"state.currentPage"
*		.begin - the minimum value that the proerty will take
*		.end - the maximum value the property will take
*		.increments - step value for the proerty
*		alternatively, you can specify .parts - number of increments/step values between .begin and .end
*		.action - callback function to specify action after the slider has been moved
*	action callabck looks like this:
*	function (appHandle, date){
*		// The bound property will already have been updated by the slider
*		// use this cal back to perform additional functions like refreshing the app 	
*	}
*/
SAGE2WidgetControlBar.prototype.addSlider = function(data){
	//begin,parts,end,action, property, appHandle
	if (this.hasSlider === false){
		
		var slider = new SAGE2WidgetControls.slider();
		slider.id = "slider" + this.itemCount;
		slider.appId = this.id;
		slider.begin = data.begin;
		slider.end = data.end;
		if(data.increments){
			slider.increments = data.increments || 1;
			slider.parts = (slider.end - slider.begin)/slider.increments;
		}
		else if(data.parts){
			slider.parts = data.parts || 1;
			slider.increments = (slider.end - slider.begin)/slider.parts;
		}
		slider.call = data.action || null;
		slider.appProperty = data.property;
		slider.appHandle = data.appHandle;
		slider.sliderVal = data.begin;
		slider.width = 12.0*ui.widgetControlSize;
		if (slider.parts < 1)
			return;

		this.hasSlider = true;
		this.slider = slider;
		this.items.push(slider);
		this.itemCount++;
	}
	
};


/**
*	Computes the dimensions of the widget control bar
*/
SAGE2WidgetControlBar.prototype.computeSize = function(){
	var size = {
		width:0,
		height:0
	};
	var dimensions = {};
	dimensions.buttonRadius = 0.8 * ui.widgetControlSize;
	dimensions.radius = dimensions.buttonRadius * 5.027 ; // tan(78.5): angle subtended at the center is 22.5
	dimensions.innerR = dimensions.radius - dimensions.buttonRadius -3; // for the pie slice
	dimensions.outerR = dimensions.radius + dimensions.buttonRadius +3;

	size.height = dimensions.outerR * 2 + 5;
	size.width = size.height;

	if (this.hasSlider === true){
		size.width = size.width  + this.slider.width ;
	}
	else if ( this.hasTextInput === true){
		size.width = size.width  + this.textInput.width;
	}
	this.controlDimensions = dimensions;
	return size;
}

/**
*	Creates control bar and elements from the layout options and element specifications
*/
SAGE2WidgetControlBar.prototype.createControls = function(ctrId){
	var size = this.computeSize();
	var dimensions = this.controlDimensions;
	
	this.controlSVG = Snap(size.width, size.height);
	var center = {x:size.height/2.0,y:size.height/2.0}; //change to reflect controlSVG center

	this.controlSVG.attr({
		fill: "#000",
		id: ctrId + "SVG"
	});
	

	if (this.layoutOptions.drawBackground === true)
		drawBackgroundForRadialLayout (this.controlSVG,center, dimensions.outerR);


	
	/*Place buttons*/
	var angleRanges = (this.buttonGroups.length===1)? [[56.25,303.75]]:[[56.25,123.75],[236.25,303.75],[146.25,213.75],[326.25,393.75]];

	for(var g=0; g < this.buttonGroups.length; g++){
		var buttons = this.buttonGroups[g];
		var range = angleRanges[g];
		var start = range[0];
		var end = range[1];
		if (this.layoutOptions.drawGroupBoundaries===true)
			drawPieSlice(this.controlSVG, start-5,end+5, dimensions.innerR, dimensions.outerR,center);
		var betweenButtons = (end - start)/buttons.length;
		var padding = betweenButtons/2;
		var theta = start + padding;
		for (var b=0; b<buttons.length;b++){
			var point = polarToCartesian(dimensions.radius,theta,center);
			if (this.layoutOptions.drawSpokes === true)
				drawSpokeForRadialLayout(this.controlSVG,center,point);
			this.createButton(buttons[b],point.x,point.y,dimensions.buttonRadius-2);
			theta = theta + betweenButtons;
		}

	}
	var d, leftMidOfBar;
	if (this.hasSlider===true && this.hasTextInput === true){
		d = makeBarPath(5,45, dimensions.innerR, center, this.slider.width);
		leftMidOfBar = polarToCartesian(dimensions.innerR,23, center);
		if (this.layoutOptions.drawSpokes === true)
			drawSpokeForRadialLayout(this.controlSVG,center,leftMidOfBar);
		this.createSlider(leftMidOfBar.x,leftMidOfBar.y, d);
		d = makeBarPath(315,355, dimensions.innerR, center, this.textInput.width);
		leftMidOfBar = polarToCartesian(dimensions.innerR,337, center);
		if (this.layoutOptions.drawSpokes === true)
			drawSpokeForRadialLayout(this.controlSVG,center,leftMidOfBar);
		this.createTextInput(leftMidOfBar.x,leftMidOfBar.y, d);
	}
	else if (this.hasSlider===true){
		d = makeBarPath(340,380, dimensions.innerR, center, this.slider.width);
		leftMidOfBar = polarToCartesian(dimensions.innerR,0, center);
		if (this.layoutOptions.drawSpokes === true)
			drawSpokeForRadialLayout(this.controlSVG,center,leftMidOfBar);
		this.createSlider(leftMidOfBar.x,leftMidOfBar.y, d);
	}
	else if (this.hasTextInput===true){
		d = makeBarPath(340,380, dimensions.innerR, center, this.textInput.width);
		leftMidOfBar = polarToCartesian(dimensions.innerR,0, center);
		if (this.layoutOptions.drawSpokes === true)
			drawSpokeForRadialLayout(this.controlSVG,center,leftMidOfBar);
		this.createTextInput(leftMidOfBar.x,leftMidOfBar.y, d);
	}
	drawControlCenter(this.controlSVG,center, dimensions.innerR - 2*dimensions.buttonRadius, "SAGE2");
	var ctrHandle = document.getElementById(ctrId + "SVG");
	return ctrHandle;
}

function drawSpokeForRadialLayout(paper,center,point){
	var spoke = paper.line(center.x,center.y,point.x,point.y);
	spoke.attr({
		stroke: "rgba(250,250,250,1.0)",
		strokeWidth: 2,
		fill: "none"
	});
}

function drawBackgroundForRadialLayout(paper, center, radius){
	var backGround = paper.circle(center.x,center.y,radius);
	backGround.attr({
		fill: "rgba(60,60,60,0.5)",
		stroke: "rgba(250,250,250,1.0)",
		strokeDasharray: "2,1",
		strokeWidth: 5
	});
}

function drawControlCenter(paper, center, radius, initialText){
	var controlCenter = paper.circle(center.x,center.y,radius);
	controlCenter.attr("class", "widgetBackground");
	var controlCenterLabel = paper.text(center.x,center.y,initialText);
	controlCenterLabel.attr("class", "widgetText");
	controlCenterLabel.attr({
		fontSize: (0.045 * ui.widgetControlSize) + "em"
	})
	controlCenterLabel.attr("dy", "0.4em");
}

function drawPieSlice(paper, start,end, innerR, outerR, center){
	var pointA= polarToCartesian(innerR,start,center);
	var pointB = polarToCartesian(outerR,start,center);
	var pointC= polarToCartesian(outerR,end,center);
	var pointD = polarToCartesian(innerR,end,center);
	
	var d = "M " + pointA.x + " " + pointA.y
		+ "L " + pointB.x + " " + pointB.y
		+ "A " + outerR + " " + outerR + " " + 0 + " " + 0 + " " + 0 + " " + pointC.x + " " + pointC.y 
		+ "L " + pointD.x + " " + pointD.y
		+ "A " + innerR + " " + innerR + " " + 0 + " " + 0 + " " + 1 + " " + pointA.x + " " + pointA.y + "";

	var groupBoundaryPath = paper.path(d);
	groupBoundaryPath.attr("class", "widgetBackground");
}

function makeBarPath(start,end, innerR, center, width){
	var center2 = {x:center.x+width,y:center.y};
	var pointA= polarToCartesian(innerR,start,center);
	var pointB = polarToCartesian(innerR,start,center2);
	var pointC= polarToCartesian(innerR,end,center2);
	var pointD = polarToCartesian(innerR,end,center);
	
	var d = "M " + pointA.x + " " + pointA.y
		+ "L " + pointB.x + " " + pointB.y
		+ "A " + innerR + " " + innerR + " " + 0 + " " + 0 + " " + 0 + " " + pointC.x + " " + pointC.y 
		+ "L " + pointD.x + " " + pointD.y
		+ "A " + innerR + " " + innerR + " " + 0 + " " + 0 + " " + 1 + " " + pointA.x + " " + pointA.y + "";

	return d;
}

/**
*	Creates a slider from the slider specification
*/
SAGE2WidgetControlBar.prototype.createSlider = function(x, y, outline){
	var sliderHeight = 1.5 * ui.widgetControlSize;
	var sliderArea = this.controlSVG.path(outline);
	var sliderAreaWidth = sliderArea.getBBox().w;
	sliderArea.attr("class", "widgetBackground");
	x = x + sliderAreaWidth*0.05;
	var sliderLine = this.controlSVG.line(x,y,x+sliderAreaWidth*0.85,y); 
	sliderLine.attr({
		strokeWidth:1,
		id:this.slider.id + 'line',
		style:"shape-rendering:crispEdges;",
		stroke:"rgba(230,230,230,1.0)"
	});
	var knobWidth = 3.6*ui.widgetControlSize;

	var knobHeight = 1.5*ui.widgetControlSize;
	var sliderKnob = this.controlSVG.rect(x+0.5*ui.widgetControlSize,y - knobHeight/2, knobWidth, knobHeight);
	sliderKnob.attr({
		id:this.slider.id + 'knob',
		class: "sliderKnob",
		rx:(knobWidth/16) + "px",
		ry:(knobHeight/8) + "px",
		//style:"shape-rendering:crispEdges;",
		fill:"rgba(110,110,110,1.0)",
		strokeWidth : 1,
		stroke: "rgba(230,230,230,1.0)"
	});
	var sliderKnobLabel = this.controlSVG.text(x+0.5*ui.widgetControlSize + knobWidth/2.0, y,"-");
	var fontSize = 0.030 * ui.widgetControlSize;
	sliderKnobLabel.attr({
		id: this.slider.id+ "knobLabel",
		class:"sliderText",
		dy:(knobHeight*0.20) + "px",
		fontSize:fontSize + "em"
	});
	

	var slider = this.controlSVG.group(sliderArea,sliderLine,sliderKnob,sliderKnobLabel);
	sliderKnob.data("appId", this.slider.appId);
	sliderKnobLabel.data("appId", this.slider.appId);
	slider.data('begin', this.slider.begin);
	slider.data("appId", this.slider.appId);
	slider.data('end', this.slider.end);
	slider.data('parts', this.slider.parts);
	slider.data('increments', this.slider.increments);
	slider.data('call', this.slider.call);
	slider.data('appProperty', this.slider.appProperty);
	var _this = this;
	function moveSlider(){
		var slider = sliderKnob.parent();
		var sliderLine = slider.select("line");
		var bound = sliderLine.getBBox();
		var left = bound.x + knobWidth/2.0;
		var right = bound.x2 - knobWidth/2.0;
		var begin = slider.data('begin');
		var end = slider.data('end');
		var parts = slider.data('parts');
		var increments = slider.data('increments');
		var deltaX = (right-left)/parts;
		var app = getProperty(_this.slider.appHandle,_this.slider.appProperty);
		var sliderVal = app.handle[app.property];
		var n = Math.floor(0.5 + (sliderVal-begin)/increments);
		if (isNaN(n)===true)
			n = 0;

		var position= left + n*deltaX;
		var cxVal = sliderKnob.attr('cx');
		
		if(position< left )
			position = left;
		else if (position > right )
			position = right;
		
		sliderKnob.animate({x: position - knobWidth/2.0 },100,mina.linear);
		sliderKnobLabel.attr("text", (n+begin) +" / "+ end );
		sliderKnobLabel.animate({x: position},100,mina.linear,moveSlider);
	}
	
	moveSlider();
	
	return slider;
}

function mapMoveToSlider(sliderKnob, position){
	var slider = sliderKnob.parent();
	var sliderLine = slider.select("line");
	var knobWidth = sliderKnob.getBBox().w;
	var bound = sliderLine.getBBox();
	var left = bound.x + knobWidth/2.0 ;
	var right = bound.x2 - knobWidth/2.0 ;
	var begin = slider.data('begin');
	var end = slider.data('end');
	var parts = slider.data('parts');
	var increments = slider.data('increments');

	if(position< left )
		position = left;
	else if (position > right )
		position = right;

	var deltaX = (right-left)/parts;
	var n = Math.floor(0.5 + (position-left)/deltaX);
	if (isNaN(n)===true)
		n = 0;
	var sliderValue = begin + n*increments;
	return sliderValue;
}

/**
*	Creates a button from the button specification
*/
SAGE2WidgetControlBar.prototype.createButton = function(buttonSpec, cx, cy, rad){
	var buttonRad = rad;
	var buttonBack = this.controlSVG.circle(cx,cy,buttonRad);
	buttonBack.attr({
		id: buttonSpec.id + "bkgnd",
		fill:"rgba(110,110,110,1.0)",
		strokeWidth : 1,
		stroke: "rgba(230,230,230,1.0)"
	});

	var type = this.buttonType[buttonSpec.type];
	var pthf = "M " + cx + " " + cy  + " " + type["from"];
	var ptht= "M " + cx + " " + cy  + " " + type["to"];
	var buttonCover = this.controlSVG.path(pthf);
	var coverWidth = type["width"];
	var coverHeight = type["height"];
	buttonCover.attr({
		id: buttonSpec.id + "cover",
		transform: "s " + (buttonRad/(1.5*coverWidth)) + " " + (buttonRad/coverHeight),
		strokeWidth:type["strokeWidth"],
		stroke:"rgba(250,250,250,1.0)",
		style:"stroke-linecap:round; stroke-linejoin:round",
		fill:type["fill"]
	});
	var button = this.controlSVG.group(buttonBack,buttonCover);

	buttonCover.data("call",buttonSpec.call);
	buttonCover.data("switch", type["switch"]) ;
	buttonCover.data("from",pthf);
	buttonCover.data("to",ptht);
	buttonCover.data("delay",type["delay"]);
	buttonCover.data("appId", buttonSpec.appId);
	buttonBack.data("appId", buttonSpec.appId);
	button.data("call",buttonSpec.call);
	button.data("appId", buttonSpec.appId);
	return button;
}

/**
*	Creates a text-input from the text-input specification
*/
SAGE2WidgetControlBar.prototype.createTextInput = function(x, y, outline){
	var uiElementSize = ui.widgetControlSize;
	var textInputAreaHeight = 1.5 * uiElementSize;
	var fontSize = 0.040 * ui.widgetControlSize;

	var textInputOutline = this.controlSVG.path(outline);
	textInputOutline.attr("class","widgetBackground");
	var textInputBarWidth = textInputOutline.getBBox().w;
	
	x = x + textInputBarWidth*0.075;
	var textArea = this.controlSVG.rect(x,y-textInputAreaHeight/2.0,textInputBarWidth*0.80, textInputAreaHeight);
	textArea.attr({
		id: this.textInput.id + "Area",
		fill:"rgba(100,100,100,1.0)",
		strokeWidth : 1,
		stroke: "rgba(230,230,230,1.0)",
	});

	var pth = "M " + (x+2) + " " + (y-textInputAreaHeight/2.0 +2) + " l 0 " + (textInputAreaHeight - 4);
	var blinker = this.controlSVG.path(pth);
	blinker.attr({
		id: this.textInput.id + "Blinker",
		stroke:"#ffffff",
		fill:"#ffffff",
		style:"shape-rendering:crispEdges;",
		strokeWidth:1
	});

	var show = function() {
		blinker.animate({"stroke":"#ffffff"},800,mina.easein,hide);
	};

	var hide = function() {
		blinker.animate({"stroke":"#000000"},200,mina.easeout,show);
	};

	var textData = this.controlSVG.text(x+2, y,"");
	textData.attr({
		id: this.textInput.id + "TextData",
		style:"fill: #ffffff; font-family:sans-serif; font-size:" + fontSize + "em; font-weight:lighter; font-style:normal;",
		dy: (textArea.attr("height")*0.20) + "px"
	});
	var textInput = this.controlSVG.group(textArea,blinker);
	textInput.add(textData);
	textArea.data("appId", this.textInput.appId);
	textData.data("appId",this.textInput.appId);
	blinker.data("appId", this.textInput.appId);
	textInput.data("appId", this.textInput.appId);
	blinker.data("show", show); // Find out how to stop animating the blinker
	textInput.data("buffer","");
	textInput.data("blinkerPosition",0) ;
	textInput.data("blinkerSuf"," " + (y-textInputAreaHeight/2.0 +2) + " l 0 " + (textInputAreaHeight - 4));
	textInput.data("left", x+2);
	textInput.data("call", this.textInput.call);
	textInput.data("head", "");
	textInput.data("prefix", "");
	textInput.data("suffix", "");
	textInput.data("tail", "");
	
	show();

	return textInput;
}


insertText = function(textInput, code, printable){
	var textBox = textInput.select("rect");
	var boxWidth = textBox.attr("width");
	var tAxVal = textInput.data("left"); 
	var rightEnd = tAxVal + parseInt(textBox.attr("width"));
	var position= textInput.data("blinkerPosition");
	var displayText = '';
	ctrl = textInput.select("text");
	buf = textInput.data("text") || '';	
	
	var head = textInput.data("head");
	var prefix = textInput.data("prefix");
	var suffix = textInput.data("suffix");
	var tail = textInput.data("tail");
	
	if (printable){
		prefix = prefix + String.fromCharCode(code);
	}else{
		switch (code){
			case 37://left
				if (prefix.length > 0){
					suffix = prefix.slice(-1) + suffix;
					prefix = prefix.slice(0,-1);
				}
				else if (head.length > 0){
					suffix = head.slice(-1) + suffix;
					head = head.slice(0,-1);
				}
				break;
			case 39://right
				if (suffix.length > 0){
					prefix = prefix + suffix.slice(0,1);
					suffix = suffix.slice(1);
				}
				else if (tail.length > 0){
					prefix = prefix + tail.slice(0,1);
					tail = tail.slice(1);
				}
				break;
			case 8://backspace
				if (prefix.length > 0){
					prefix = prefix.slice(0,-1);
				}
				else{
					head = head.slice(0,-1);
				}
				suffix = suffix + tail.slice(0,1);
				tail = tail.slice(1);
				break;
			case 46://delete
				if (suffix.length > 0){
					suffix = suffix.slice(1) + tail.slice(0,1);
				}
				tail = tail.slice(1);
				break;				
		}
	}
	displayText = prefix + suffix;
	ctrl.attr("text",displayText);
	var textWidth = (displayText.length > 0)? ctrl.getBBox().width : 0;
	while (textWidth > boxWidth - 5){
		if (suffix.length > 0){
			tail = suffix.slice(-1) + tail;
			suffix = suffix.slice(0,-1);
		}
		else{
			head = head + prefix.slice(0,1);
			prefix = prefix.slice(1);
		}
		displayText = prefix + suffix;
		ctrl.attr("text",displayText);
		textWidth = (displayText.length > 0)? ctrl.getBBox().width : 0;
	}
	ctrl.attr("text", "l");
	var extraspace = ctrl.getBBox().width;
	ctrl.attr("text",prefix + "l");
	var position= (prefix.length > 0)? ctrl.getBBox().width - extraspace : 0; // Trailing space is not considered to BBbox width, hence extraspace is a work around
	pth = "M " + (textInput.data("left") + position) + textInput.data("blinkerSuf");
	textInput.select("path").attr({path:pth});
	ctrl.attr("text",prefix + suffix);
	textInput.data("head", head);
	textInput.data("prefix", prefix);
	textInput.data("suffix", suffix);
	textInput.data("tail", tail);

};

getText = function(textInput){
	return textInput.data("head") + textInput.data("prefix") + textInput.data("suffix") + textInput.data("tail");
};

getWidgetControlById = function(ctrl){
	var svgElements = Snap.selectAll('*');
	var requestedSvgElement = null;
	for(var l=0; l< svgElements.length; l++){
		if (svgElements[l].attr("id") === ctrl.ctrlId && svgElements[l].data("appId") === ctrl.appId){
			requestedSvgElement = svgElements[l];
			break;
		}
	}
	return requestedSvgElement;
};

getProperty = function (objectHandle,property){
	var names = property.split('.');
	var handle  = objectHandle;
	var i     = 0;
	for (;i<names.length-1;i++) {
		handle = handle[names[i]];
	}
	return {handle:handle, property:names[i]};
};

getWidgetControlUnderPointer = function(data, offsetX, offsetY){
	var pointerElement = document.getElementById(data.ptrId);
	pointerElement.style.left = (parseInt(pointerElement.style.left) + 10000) + "px"; 
	var widgetControlUnderPointer = Snap.getElementByPoint(data.x-offsetX,data.y-offsetY);
	pointerElement.style.left = (parseInt(pointerElement.style.left) - 10000) + "px";
	var widgetControlId = widgetControlUnderPointer? widgetControlUnderPointer.attr("id"):"";
	if (/control/.test(widgetControlId) || /button/.test(widgetControlId) || /slider/.test(widgetControlId) || /textInput/.test(widgetControlId))
		return widgetControlUnderPointer;
	return null;
};


polarToCartesian = function (radius,theta,center){
	theta = theta * Math.PI / 180.0;
	if (center === undefined || center === null)
		center = {x:0,y:0};
	var x = center.x + radius*Math.cos(theta);
	var y = center.y - radius*Math.sin(theta);
	return {x:x,y:y};
}

/*
String.prototype.width = function(font) {
	var f = font || '12px arial';
	var div = document.createElement('DIV');
	//div.style['width'] = 'auto';
	//div.style['height'] = 'auto';
	div.innerHTML = this;
	div.style['position'] = 'absolute';
	div.style['float'] = 'left';
	div.style['white-space'] = 'nowrap';
	div.style['visibility']= 'hidden';
	div.style['font'] = f ;
	
	document.body.appendChild(div);
	var w = div.offsetWidth;
	document.body.removeChild(div);
  	return w;
}
SAGE2WidgetControlBar.prototype.addLabel = function(data){
	
	var labelHeight = 1.5 * ui.widgetControlSize;
	var l = new SAGE2WidgetControls.label();
	l.id = "label" + this.itemCount;
	l.appId = this.id;
	l.appProperty = data.property;
	l.appHandle = data.appHandle;
	var font = (labelHeight-12) + 'px arial';

	var doubleUs = new Array(data.textLength+1).join('W');
	l.width =  doubleUs.width(font);
	this.items.push(l);
	this.itemCount++;
};
function createLabel(paper, labelSpec, x, y){
	var labelHeight = 1.5 * ui.widgetControlSize;
	var lArea = paper.rect(x,y-labelHeight,labelSpec.width, labelHeight);
	lArea.attr({
		id: labelSpec.id + "Area",
		fill:"#666666",
		strokeWidth : 1,
		stroke: "#666666"
	});

	
	var lData = paper.text(x+2, y-8,"");
	lData.attr({
		id: labelSpec.id + "TextData",
		style:"fill: #000000; stroke: #000000; shape-rendering:crispEdges; font-family:Times,sans-serif; font-size:" + (labelHeight-12) + "px; font-weight:200; font-style:normal;"
		//clipPath:paper.rect(x+2,y-labelHeight, labelSpec.width,labelHeight)
	});
	var label = paper.group(lArea,lData);
	
	lArea.data("appId", labelSpec.appId);
	lData.data("appId",labelSpec.appId);
	label.data("appId", labelSpec.appId);
	
	//label.data("left", x+2);
	function showText(){
		var app = getProperty(labelSpec.appHandle,labelSpec.appProperty);
		var data = app.obj[app.property];
		lData.attr('text',data);
		lData.animate({width:lData.getBBox().width},10,mina.linear,showText);
	}

	showText();
	return label;
}

*/