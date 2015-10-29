"use strict"

function DrawingManager(config) {

	this.lastId = 0;
	this.dictionaryId = {};
	this.idPrequel = "drawing_";
	this.clientIDandSockets = {};
	this.newDrawingObject = {};
	this.style = {fill: "none", stroke: "white", "stroke-width": "5px", "stroke-linecap": "round"};
	this.drawingMode = true;
	this.drawState = [{id: "drawing_1",type: "path",options: { points: [{x: 100,y: 200}, {x: 200,y: 300}] }, style: this.style}];
	this.drawingsUndone = [];
	this.tilesPosition = [];
	this.palettePosition = {};
	this.calculateTileDimensions(config);
	this.actualAction = "drawing"
	this.possibleActions = ["drawing", "movingPalette"];
	this.paintingMode = false;
	// An object drawing is defined as follows:
	// {
	// id: String
	// type: Type of the svg element
	// options : {} Object containing all the attributes needed by that type of element
	// style: {} Current style of the object to be drawn
	// }


}


DrawingManager.prototype.calculateTileDimensions = function(config) {

	// This method crashes if config.displays is less than product of rows and columns
	// Check if the clientID corresponds to the actual clientID
	var clients = config.layout.rows * config.layout.columns;
	var width = config.resolution.width;
	var height = config.resolution.height;

	for (var i = 0; i < clients; i++) {

		var display = config.displays[i];

		var startX = width * display.column;
		var endX = startX + width - 1;

		var startY = height * display.row;
		var endY = startY + height - 1;

		var position = {startX: startX, endX: endX, startY: startY, endY: endY, clientID: i};

		this.tilesPosition.push(position);

	};

}

DrawingManager.prototype.init = function(wsio) {

	var clientID = wsio.clientID;

	if (clientID in this.clientIDandSockets) {
		this.clientIDandSockets[clientID].push(wsio);
	} else {
		this.clientIDandSockets[clientID] = [wsio];
	}

	this.drawingInit(wsio, this.drawState);
}

DrawingManager.prototype.initAll = function() {

	for (var clientID in this.clientIDandSockets) {
		for (var i in this.clientIDandSockets[clientID]) {
			var wsio = this.clientIDandSockets[clientID][i];
			this.drawingInit(wsio, this.drawState);
		}
	}

}

DrawingManager.prototype.enablePaintingMode = function() {
	this.paintingMode = true;
}

DrawingManager.prototype.disablePaintingMode = function() {
	this.paintingMode = false;
}


DrawingManager.prototype.removeWebSocket = function(wsio) {

	// Detecting the position of the socket into the corresponding socket array
	var clientID = wsio.clientID;
	var position = this.clientIDandSockets[clientID].indexOf(wsio);
	if (position > -1) {
		this.clientIDandSockets[clientID].splice(wsio, 1);
		console.log("Socket removed from drawingManager");
	} else {
		console.log("Attempt to remove a socket from drawingManager, but not present");
	}

}

DrawingManager.prototype.clearDrawingCanvas = function() {
	this.drawState = [];
	this.initAll();
}

DrawingManager.prototype.undoLastDrawing = function() {
	var undone = this.drawState.pop();
	if (undone) {
		this.drawingsUndone.push(undone);
		this.initAll();
	}
}

DrawingManager.prototype.redoDrawing = function() {
	var reDone = this.drawingsUndone.pop();
	if (reDone) {
		this.drawState.push(reDone);
		var involvedClient = this.checkInvolvedClient(reDone.options.points[0].x, reDone.options.points[0].y);
		var manipulatedObject = this.manipulateDrawingObject(reDone, involvedClient);
		this.update(manipulatedObject, involvedClient);
	}
}

DrawingManager.prototype.changeStyle = function(data) {
	this.style[data.name] = data.value;
	this.sendStyleToPalette(this.paletteID,this.style);
}

DrawingManager.prototype.enableDrawingMode = function(data) {
	console.log("Drawing mode enabled");
	this.drawingMode = true;
	this.paletteID = data.id;
	this.sendStyleToPalette(this.paletteID,this.style);
}

DrawingManager.prototype.update = function(drawingObject, clientID) {

	for (var ws in this.clientIDandSockets[clientID]) {

		this.drawingUpdate(this.clientIDandSockets[clientID][ws], drawingObject);
	}

	// Send the object also to client -1, but not manipulated. Maybe create another udpate.

}
DrawingManager.prototype.copy = function(a) {
	return JSON.parse(JSON.stringify(a));
}

DrawingManager.prototype.distance = function(p1,p2) {
	return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
}

DrawingManager.prototype.getNewId = function(sourceId) {
	this.lastId++;
	var newId = this.idPrequel + this.lastId;
	this.dictionaryId[sourceId] = newId;
	return newId;
}

DrawingManager.prototype.realeaseId = function(sourceId) {
	delete this.dictionaryId[sourceId];
}

DrawingManager.prototype.existsId = function(sourceId) {
	return sourceId in this.dictionaryId
}

DrawingManager.prototype.newDrawingObjectFunc = function(e,posX,posY) {

	// Create new Drawing object
	var drawingId = this.getNewId(e.sourceId);
	this.newDrawingObject[drawingId] = {};
	this.newDrawingObject[drawingId]["id"] = drawingId;
	this.newDrawingObject[drawingId]["type"] = "circle";
	this.newDrawingObject[drawingId]["options"] = { points: [ {x: posX,y: posY}] };
	this.newDrawingObject[drawingId]["style"] = this.copy(this.style);

	this.drawState.push(this.newDrawingObject[drawingId]);

}

DrawingManager.prototype.updateDrawingObject = function(e,posX,posY) {
	if (!this.existsId(e.sourceId)) {
		this.newDrawingObjectFunc(e, posX, posY);
	}
	var drawingId = this.dictionaryId[e.sourceId];
	var lastPoint = this.newDrawingObject[drawingId]["options"]["points"]
					[this.newDrawingObject[drawingId]["options"]["points"].length - 1];
	if (this.distance(lastPoint, {x: posX, y: posY}) > 0.5) {
		this.newDrawingObject[drawingId]["type"] = "path";
		this.newDrawingObject[drawingId]["options"]["points"].push({x: posX,y: posY});
	}
}
DrawingManager.prototype.touchInsidePalette = function(x,y) {
	return ((x >= this.palettePosition.startX) && (x <= this.palettePosition.endX) &&
			(y >= this.palettePosition.startY) && (y <= this.palettePosition.endY));
}
DrawingManager.prototype.touchInsidePaletteTitleBar = function(x,y) {
	return ((x >= this.palettePosition.startX) && (x <= this.palettePosition.endX) &&
			(y >= this.palettePosition.startY - 58) && (y < this.palettePosition.startY));
}


DrawingManager.prototype.pointerEvent = function(e,sourceId,posX,posY,w,h) {

	if (this.paintingMode) {
		this.style["stroke-width"] = Math.max(w,h)
	}

	if (e.type == 5) {
		if (this.touchInsidePaletteTitleBar(posX,posY)) {
			this.actualAction = "movingPalette"
			this.touchOnPaletteOffsetX = posX - this.palettePosition.startX;
			this.touchOnPaletteOffsetY = posY - this.palettePosition.startY + 58; // Title bar height
			return;
		}
		// pointer down
		if (this.touchInsidePalette(posX,posY)) {
			this.sendTouchToPalette(this.paletteID, posX - this.palettePosition.startX ,posY - this.palettePosition.startY);
			return;
		}else {
			this.drawingsUndone = [];
			this.newDrawingObjectFunc(e, posX, posY);
		}
	} else if (e.type == 4) {
		if (this.actualAction == "movingPalette") {
			this.movePaletteTo(this.paletteID
								, posX - this.touchOnPaletteOffsetX
								, posY - this.touchOnPaletteOffsetY
								, this.palettePosition.endX - this.palettePosition.startX
								, this.palettePosition.endY - this.palettePosition.startY - 58);
			return;
		}


		if (this.touchInsidePalette(posX,posY)) {
			return;
		}


		// pointer move
		this.updateDrawingObject(e, posX, posY);

	} else if (e.type == 6) {
		if (this.actualAction == "movingPalette") {
			this.actualAction = "drawing";
		}
		// pointer release
		this.realeaseId(e.sourceId);
		return;
	}

	var drawingId = this.dictionaryId[e.sourceId];
	console.log(drawingId)
	console.log(e.sourceId)
	var involvedClient = this.checkInvolvedClient(posX, posY);
	var manipulatedObject = this.manipulateDrawingObject(this.newDrawingObject[drawingId], involvedClient);

	this.update(manipulatedObject, involvedClient);
}

DrawingManager.prototype.manipulateDrawingObject = function(drawingObject, clientID) {

	// Cloning the drawing object to manipuate its position, in order to send to the clients its relativ position
	var manipulatedObject = JSON.parse(JSON.stringify(drawingObject));

	var offsetX = this.tilesPosition[clientID].startX;
	var offsetY = this.tilesPosition[clientID].startY;

	for (var i in manipulatedObject.options.points) {
		var point = manipulatedObject.options.points[i]

		manipulatedObject.options.points[i].x = point.x - offsetX;
		manipulatedObject.options.points[i].y = point.y - offsetY;

	}

	return manipulatedObject;

}

DrawingManager.prototype.isOnPalette = function(posX, posY) {

	if (this.palettePosition.startX <= posX &
		this.palettePosition.endX >= posX &
		this.palettePosition.startY <= posY &
		this.palettePosition.endY >= posY) {

		return true;

	}

	return false;
}

DrawingManager.prototype.updatePalettePosition = function(data) {
	this.palettePosition.startX = data.startX;
	this.palettePosition.startY = data.startY + 58;
	this.palettePosition.endX = data.endX;
	this.palettePosition.endY = data.endY + 58;
}


DrawingManager.prototype.checkInvolvedClient = function(posX, posY) {

	// Probably this method is inconsistent if the object start from a display and terminates in another

	for (var i in this.tilesPosition) {
		var client = this.tilesPosition[i];
		if (client.startX <= posX &
			client.endX >= posX &
			client.startY <= posY &
			client.endY >= posY) {

			return client.clientID;

		}

	}

	console.log("No single client involved")
	return -1;

}

DrawingManager.prototype.saveDrawings = function() {
	this.saveSession(this.drawState);
}

DrawingManager.prototype.loadDrawings = function(data) {
	this.loadSession(data);
}

DrawingManager.prototype.loadOldState = function(data) {
	this.drawState = data || [];
	this.initAll();
}

DrawingManager.prototype.setCallbacks = function(
		drawingInitCB,
		drawingUpdateCB,
		sendTouchToPaletteCB,
		sendStyleToPaletteCB,
		movePaletteToCB,
		saveSessionCB,
		loadSessionCB
	) {
	this.drawingInit = drawingInitCB;
	this.drawingUpdate = drawingUpdateCB;
	this.sendTouchToPalette = sendTouchToPaletteCB;
	this.sendStyleToPalette = sendStyleToPaletteCB;
	this.movePaletteTo = movePaletteToCB;
	this.saveSession = saveSessionCB;
	this.loadSession = loadSessionCB;
};
module.exports = DrawingManager;