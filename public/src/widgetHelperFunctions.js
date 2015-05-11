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
 * Provides widget controls and helper functionality for custom application user interface
 *
 * @module client
 * @submodule widgets
 */
var dynamicStyleSheets = {};
var svgBackgroundForWidgetConnectors = null;

function drawSpokeForRadialLayout(instanceID, paper, center, point){
	var spoke = paper.line(center.x, center.y, point.x, point.y);
	spoke.attr({
		stroke: "rgba(250,250,250,1.0)",
		strokeWidth: 3,
		fill: "none"
	});
	spoke.data("instanceID", instanceID);
}

function drawBackgroundForWidgetRadialDial(instanceID, paper, center, radius){
	var backGround = paper.circle(center.x, center.y, radius);
	var grad = paper.gradient("r(0.5, 0.5, 0.40)rgba(190,190,190,0.7)-rgba(90,90,90,0.4)");
	backGround.attr({
		id: instanceID + "backGround",
		fill: grad,//"rgba(60,60,60,0.5)",
		stroke: "rgba(250,250,250,1.0)",
		strokeDasharray: "2,1",
		strokeWidth: 5
	});
	backGround.data("paper", paper);
	backGround.data("instanceID", instanceID);
}

function drawWidgetControlCenter(instanceID, paper, center, radius, initialText){
	var controlCenter = paper.circle(center.x, center.y, radius);
	controlCenter.attr({
		fill:"rgba(110,110,110,1.0)",
		stroke: "rgba(200,200,200,0.8)",
		id: instanceID + "menuCenter"
	});
	/*var controlCenterLabel = paper.text(center.x,center.y,initialText);
	controlCenterLabel.attr("class", "widgetText");
	controlCenterLabel.attr({
		fontSize: (0.030 * ui.widgetControlSize) + "em"
	});
	controlCenterLabel.attr("dy", "0.4em");*/
	controlCenter.data("paper", paper);
	controlCenter.data("instanceID", instanceID);
}

function drawPieSlice(paper, start, end, innerR, outerR, center){
	var pointA= polarToCartesian(innerR, start, center);
	var pointB = polarToCartesian(outerR, start, center);
	var pointC= polarToCartesian(outerR, end, center);
	var pointD = polarToCartesian(innerR, end, center);

	var d = "M " + pointA.x + " " + pointA.y + "L " + pointB.x + " " + pointB.y +
		"A " + outerR + " " + outerR + " " + 0 + " " + 0 + " " + 0 + " " + pointC.x + " " + pointC.y + "L " + pointD.x + " " + pointD.y +
		"A " + innerR + " " + innerR + " " + 0 + " " + 0 + " " + 1 + " " + pointA.x + " " + pointA.y + "";

	var groupBoundaryPath = paper.path(d);
	groupBoundaryPath.attr("class", "widgetBackground");
}

function makeWidgetBarOutlinePath(start, end, innerR, center, width, offset){
	var center2 = {x:center.x+width, y:center.y};
	var pointA= polarToCartesian(innerR, start, center);
	var pointB = polarToCartesian(innerR, start, center2);
	var pointC= polarToCartesian(innerR, end, center2);
	var pointD = polarToCartesian(innerR, end, center);
	pointA.x += offset;
	pointB.x += offset;
	pointC.x += offset;
	pointD.x += offset;
	var d = "M " + pointA.x + " " + pointA.y + "L " + pointB.x + " " + pointB.y +
		"A " + innerR + " " + innerR + " " + 0 + " " + 0 + " " + 0 + " " + pointC.x + " " + pointC.y + "L " + pointD.x + " " + pointD.y +
		"A " + innerR + " " + innerR + " " + 0 + " " + 0 + " " + 1 + " " + pointA.x + " " + pointA.y + "";

	return d;
}

function mapMoveToSlider(sliderKnob, position){
	var slider     = sliderKnob.parent();
	var sliderLine = slider.select("line");
	var knobWidth  = sliderKnob.attr("width");
	var bound = sliderLine.getBBox();
	var left  = bound.x + knobWidth/2.0;
	var right = bound.x2 - knobWidth/2.0;
	var begin = slider.data('begin');
	var end   = slider.data('end');
	var parts = slider.data('parts');
	var increments = slider.data('increments');

	if(position< left )
		position = left;
	else if (position > right )
		position = right;

	var deltaX = (right-left)/parts;
	var n = Math.floor(0.5 + (position-left)/deltaX);
	if (isNaN(n) === true) n = 0;
	return {sliderValue: begin + n*increments, newPosition: left + n * deltaX};
}

function insertTextIntoTextInputWidget(textInput, code, printable){
	var textBox = textInput.select("rect");
	var boxWidth = textBox.attr("width");
	var tAxVal = textInput.data("left");
	var rightEnd = tAxVal + parseInt(textBox.attr("width"));
	var position= textInput.data("blinkerPosition");
	var displayText = '';
	var ctrl = textInput.select("text");
	var buf = textInput.data("text") || '';

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
					prefix = prefix.slice(0, -1);
				}
				else if (head.length > 0){
					suffix = head.slice(-1) + suffix;
					head = head.slice(0, -1);
				}
				break;
			case 39://right
				if (suffix.length > 0){
					prefix = prefix + suffix.slice(0, 1);
					suffix = suffix.slice(1);
				}
				else if (tail.length > 0){
					prefix = prefix + tail.slice(0, 1);
					tail = tail.slice(1);
				}
				break;
			case 8://backspace
				if (prefix.length > 0){
					prefix = prefix.slice(0, -1);
				}
				else{
					head = head.slice(0, -1);
				}
				suffix = suffix + tail.slice(0, 1);
				tail = tail.slice(1);
				break;
			case 46://delete
				if (suffix.length > 0){
					suffix = suffix.slice(1) + tail.slice(0, 1);
				}
				tail = tail.slice(1);
				break;
		}
	}
	displayText = prefix + suffix;
	ctrl.attr("text", displayText);
	var textWidth = (displayText.length > 0)? ctrl.getBBox().width : 0;
	while (textWidth > boxWidth - 5){
		if (suffix.length > 0){
			tail = suffix.slice(-1) + tail;
			suffix = suffix.slice(0, -1);
		}
		else{
			head = head + prefix.slice(0, 1);
			prefix = prefix.slice(1);
		}
		displayText = prefix + suffix;
		ctrl.attr("text", displayText);
		textWidth = (displayText.length > 0)? ctrl.getBBox().width : 0;
	}
	ctrl.attr("text", "l");
	var extraspace = ctrl.getBBox().width;
	ctrl.attr("text", prefix + "l");
	var bposition= (prefix.length > 0)? ctrl.getBBox().width - extraspace : 0; // Trailing space is not considered to BBbox width, hence extraspace is a work around
	var pth = "M " + (textInput.data("left") + bposition) + textInput.data("blinkerSuf");
	textInput.select("path").attr({path:pth});
	ctrl.attr("text", prefix + suffix);
	textInput.data("head", head);
	textInput.data("prefix", prefix);
	textInput.data("suffix", suffix);
	textInput.data("tail", tail);
}

function getTextFromTextInputWidget(textInput){
	return textInput.data("head") + textInput.data("prefix") + textInput.data("suffix") + textInput.data("tail");
}

function getWidgetControlInstanceById(ctrl){
	var svgElements = Snap.selectAll('*');
	var requestedSvgElement = null;
	for(var l=0; l< svgElements.length; l++){
		var parent = svgElements[l].parent();
		var id = svgElements[l].attr("id") || "id"; // dummy value to guard against undefined entries
		if (id.indexOf(ctrl.ctrlId) > -1 && svgElements[l].data("appId") === ctrl.appId && parent.data("instanceID")===ctrl.instanceID){
			requestedSvgElement = svgElements[l];
			break;
		}
	}
	//console.log("getWdiget:",requestedSvgElement);
	return requestedSvgElement;
}

function getProperty(objectHandle, property){
	var names = property.split('.');
	var handle  = objectHandle;
	var i     = 0;
	for (; i<names.length-1; i++) {
		handle = handle[names[i]];
	}
	return {handle:handle, property:names[i]};
}

function getWidgetControlInstanceUnderPointer(data, offsetX, offsetY){
	var pointerElement = document.getElementById(data.ptrId);
	pointerElement.style.left = (parseInt(pointerElement.style.left) + 10000) + "px";
	var widgetControlUnderPointer = Snap.getElementByPoint(data.x - offsetX, data.y - offsetY);
	pointerElement.style.left = (parseInt(pointerElement.style.left) - 10000) + "px";
	//var widgetControlId = widgetControlUnderPointer? widgetControlUnderPointer.attr("id"):"";
	//if (/control/.test(widgetControlId) || /button/.test(widgetControlId) || /slider/.test(widgetControlId) || /textInput/.test(widgetControlId))
	return widgetControlUnderPointer;
	//return null;
}


function polarToCartesian(radius, theta, center) {
	theta = theta * Math.PI / 180.0;
	if (center === undefined || center === null){
		center = {x:0, y:0};
	}
	var x = center.x + radius*Math.cos(theta);
	var y = center.y - radius*Math.sin(theta);
	return {x:x, y:y};
}


function createWidgetToAppConnector(instanceID) {
	var paper = svgBackgroundForWidgetConnectors;
	var connector = paper.line(0, 0, 0, 0);
	connector.attr({
		id: instanceID+"link",
		strokeWidth:4

	});
}

function addStyleElementForTitleColor(caption, color){
	dynamicStyleSheets[caption] = caption;
	var sheet = document.createElement('style');
	sheet.id = "title"+caption;
	var percent = 10;
	if (!color)
		color = '#666666';
	sheet.innerHTML = ".title"+caption+" { position:absolute;	border: solid 1px #000000; overflow: hidden; box-shadow: 8px 0px 15px #222222;background-image: -webkit-linear-gradient(left,"+color+" " +percent+"%, #666666 100%); background-image: -moz-linear-gradient(left,"+color+" " +percent+"%, #666666 100%); background-image: -ms-linear-gradient(left,"+color+" " +percent+"%, #666666 100%); background-image: -o-linear-gradient(left,"+color+" " +percent+"%, #666666 100%); background-image: linear-gradient(left,"+color+" " +percent+"%, #666666 100%); }";
	document.body.appendChild(sheet);
}

function removeStyleElementForTitleColor(caption){
	var sheet = document.getElementById("title"+caption);
	if (sheet){
		sheet.parentNode.removeChild(sheet);
		delete dynamicStyleSheets[caption];
	}
}

function hideAllWidgetConnectors(appId){
	var selectedAppTitle;
	if (appId in controlObjects){
		selectedAppTitle = document.getElementById(appId + "_title");
		selectedAppTitle.className = "windowTitle";
		for (var item in controlItems){
			if (item.indexOf(appId) > -1){
				hideWidgetToAppConnector(item, appId);
			}
		}
	}
}

function hideWidgetToAppConnector(instanceID, appId){
	var connector = Snap.select("[id*=\""+instanceID+"link\"]");
	if (connector){
		connector.attr({
			stroke:"none",
			filter:null,
			fill:"none"
		});
	}
	var selectedControl = Snap.select("[id*=\""+instanceID+"backGround\"]");
	if (selectedControl){
		selectedControl.attr({
			stroke: "rgba(250,250,250,1.0)"
		});
	}
	if (appId in controlObjects){

		var selectedAppTitle = document.getElementById(appId + "_title");
		selectedAppTitle.className = "windowTitle";
	}
}

function moveWidgetToAppConnector(instanceID, x1, y1, x2, y2, cutLength) {
	var a = Math.abs(x1-x2);
    var b = Math.abs(y1-y2);
    var width = Math.sqrt(a*a + b*b );
    if (parseInt(width)===0)return;
    var alpha = (cutLength-2)/width;
    x1 = alpha*x2 + (1-alpha)*x1;
    y1 = alpha*y2 + (1-alpha)*y1;

    var connector = Snap.select("[id*=\""+instanceID+"link\"]");
	if (connector){
		connector.attr({
			x1:x1,
			y1:y1,
			x2:x2,
			y2:y2
		});
	}
}

function removeWidgetToAppConnector(instanceID){
	var connector = Snap.select("[id*=\""+instanceID+"link\"]");
	if (connector){
		connector.remove();
	}
}

function setConnectorColor(instanceID, color){
	if (!color){
		color = '#666666';
	}
	var connector = Snap.select("[id*=\""+instanceID+"link\"]");
	if (connector){
		var shadow = svgBackgroundForWidgetConnectors.filter(Snap.filter.shadow(0, 0, 6, color, 3));
		connector.attr({
			stroke:"rgba(250,250,250,1.0)",
			filter:shadow
		});
	}
	var selectedControl = Snap.select("[id*=\""+instanceID+"backGround\"]");
	if (selectedControl){
		selectedControl.attr("stroke", color);
	}
}

function showWidgetToAppConnectors(data){
	var selectedAppTitle, re, styleCaption;
	selectedAppTitle = document.getElementById(data.id + "_title");
	if (!selectedAppTitle)return;
	re = /\.|\:/g;
	styleCaption = data.user_id.split(re).join("");
	selectedAppTitle.className = dynamicStyleSheets[styleCaption]? "title" + styleCaption : "windowTitle";
	for (var item in controlItems){
		if (item.indexOf(data.id) > -1 && controlItems[item].show){
			setConnectorColor(item, data.user_color);
		}
	}
}

function makeSvgBackgroundForWidgetConnectors(width, height){
	var backDrop = new Snap(parseInt(width), parseInt(height));
	backDrop.node.style.zIndex = "1";
	ui.main.appendChild(backDrop.node);
	svgBackgroundForWidgetConnectors = backDrop;
	return backDrop;
}
