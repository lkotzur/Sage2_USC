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
 * Omicron connection module for SAGE2
 * Provides external input device support
 * https://github.com/uic-evl/omicron
 *
 * @module omicron
 * @class OmicronManager
 *
 */
 
// require variables to be declared
"use strict";

var dgram     = require('dgram');
var net       = require('net');
var util      = require('util');
	
var CoordinateCalculator = require('./node-coordinateCalculator');
var OneEuroFilter        = require('./node-1euro');

var omicronManager; // Handle to OmicronManager inside of udp blocks (instead of this)

 /**
 * Omicron setup and opens a listener socket for an Omicron input server to connect to
 *
 * @method OmicronManager
 * @param sysConfig - SAGE2 system configuration file. Primararly used to grab display dimensions and Omicron settings
 */
function OmicronManager(sysConfig)
{
	omicronManager = this;
	


	this.coordCalculator = null;

	this.wandLabel = "wandTracker";
	this.wandColor = "rgba(250, 5, 5, 1.0)";

	this.wandScaleDelta = 250;
	this.acceleratedDragScale = 0;

	this.touchZoomScale = 520;

	this.wandXFilter = null;
	this.wandYFilter = null;

	this.oinputserverSocket = null;
	this.omicronDataPort = 9123;

	this.eventDebug   = false;
	this.gestureDebug = false;

	this.pointerOffscreen  = false;
	this.showPointerToggle = true;
	this.lastWandFlags     = 0;

	this.lastPosX = 0;
	this.lastPosY = 0;

	this.totalWidth  = 0;
	this.totalHeight = 0;

	// 1 euro filtering
	var freq = 120;
	var mincutoff = 1.25;
	var beta = 2;
	var dcutoff = 10;

	this.wandXFilter = new OneEuroFilter(freq, mincutoff, beta, dcutoff);
	this.wandYFilter = new OneEuroFilter(freq, mincutoff, beta, dcutoff);
	/////////

	this.config = sysConfig.experimental.omicron;

	this.coordCalculator = new CoordinateCalculator( this.config );

	var serverHost = sysConfig.host;

	if( this.config.host === undefined )
	{
		console.log('Omicron: Using web server hostname: ', sysConfig.host);
	}
	else
	{
		serverHost = this.config.host;
		console.log('Omicron: Using server hostname: ', serverHost);
	}

	if (this.config.dataPort === undefined)
	{
		console.log('Omicron: dataPort undefined. Using default: ', this.omicronDataPort);
	}
	else
	{
		this.omicronDataPort =  this.config.dataPort;
		console.log('Omicron: Listening for input server on port: ', this.omicronDataPort);
	}

	if( sysConfig.resolution )
	{
		var columns = 1;
		var rows    = 1;

		if( sysConfig.layout )
		{
			columns = sysConfig.layout.columns;
			rows    = sysConfig.layout.rows;
		}

		this.totalWidth  = sysConfig.resolution.width * columns;
		this.totalHeight = sysConfig.resolution.height * rows;

		console.log("Omicron: Touch Display Resolution: " + this.totalWidth + " " + this.totalHeight);
	}
	else
	{
		this.totalWidth  = 8160;
		this.totalHeight = 2304;
	}

	if( this.config.zoomGestureScale )
	{
		this.touchZoomScale = this.config.zoomGestureScale;
	}

	if( this.config.acceleratedDragScale )
	{
		this.acceleratedDragScale = this.config.acceleratedDragScale;
	}

	// For accepting input server connection
	var server = net.createServer(function (socket) {
		console.log('Omicron: Input server "' + socket.remoteAddress + '" connected on port ' + socket.remotePort);

		socket.on('error', function(e) {
			console.log('Omicron: Input server disconnected');
			socket.destroy(); // Clean up disconnected socket
		});

	});

	server.listen(this.omicronDataPort, serverHost);

	if( this.config.useOinputserver === true )
	{

		var msgPort = 28000;
		if( this.config.msgPort )
			msgPort = this.config.msgPort;

		this.oinputserverSocket = net.connect(msgPort, this.config.inputServerIP,  function() {
			//'connect' listener
			console.log('Connected to Omicron oinputserver at "'+this.config.inputServerIP+'" on msgPort: '+this.msgPort+'. Requesting data on port ', this.omicronDataPort);

			var sendbuf = util.format("omicron_data_on,%d\n", this.omicronDataPort);
			this.oinputserverSocket.write(sendbuf);
		});

		this.oinputserverSocket.on('end', function(e) {
			console.log('Omicron: oinputserver disconnected');
		});
		this.oinputserverSocket.on('error', function(e) {
			console.log('Omicron: oinputserver connection error - code:', e.code);
		});
	}
}

 /**
 * Sends disconnect signal to input server
 *
 * @method disconnect
 */
OmicronManager.prototype.disconnect = function() {
	if (this.oinputserverSocket) {
		var sendbuf = util.format("data_off");
		console.log("Omicron> Sending disconnect signal");
		this.oinputserverSocket.write(sendbuf);
	}
};

 /**
 * Receives server pointer functions
 *
 * @method setCallbacks
 */
OmicronManager.prototype.setCallbacks = function(
	sagePointerList,
	createSagePointerCB,
	showPointerCB,
	pointerPressCB,
	pointerMoveCB,
	pointerPositionCB,
	hidePointerCB,
	pointerReleaseCB,
	pointerScrollStartCB,
	pointerScrollCB,
	pointerDblClickCB,
	pointerCloseGestureCB,
	keyDownCB,
	keyUpCB,
	keyPressCB,
	createRadialMenuCB)
{
	this.sagePointers        = sagePointerList;
	this.createSagePointer   = createSagePointerCB;
	this.showPointer         = showPointerCB;
	this.pointerPress        = pointerPressCB;
	this.pointerMove         = pointerMoveCB;
	this.pointerPosition     = pointerPositionCB;
	this.hidePointer         = hidePointerCB;
	this.pointerRelease      = pointerReleaseCB;
	this.pointerScrollStart  = pointerScrollStartCB;
	this.pointerScroll       = pointerScrollCB;
	this.pointerDblClick     = pointerDblClickCB;
	this.pointerCloseGesture = pointerCloseGestureCB;
	this.keyDown             = keyDownCB;
	this.keyUp               = keyUpCB;
	this.keyPress            = keyPressCB;
	this.createRadialMenu    = createRadialMenuCB;

	this.createSagePointer(this.config.inputServerIP);
};

 /**
 * Manages incoming input server data
 *
 * @method runTracker
 */
OmicronManager.prototype.runTracker = function()
{
	var udp = dgram.createSocket("udp4");
	var dstart = Date.now();
	var emit   = 0;

	// array to hold all the button values (1 - down, 0 = up)
	//var buttons = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	//var mouse   = [0, 0, 0];
	//var mousexy = [0.0, 0.0];
	//var colorpt = [0.0, 0.0, 0.0];
	//var mousez  = 0;

	//var wandObjectList = []; // Mocap object list

	udp.on("message", function (msg, rinfo)
	{
		//console.log("UDP> got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
		//var out = util.format("UDP> msg from [%s:%d] %d bytes", rinfo.address,rinfo.port,msg.length);
		//console.log(out);

		if ((Date.now() - dstart) > 100)
		{
			var offset = 0;
			var e = {};
			if (offset < msg.length) e.timestamp = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.sourceId = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.serviceId = msg.readInt32LE(offset); offset += 4;
			if (offset < msg.length) e.serviceType = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.type = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.flags = msg.readUInt32LE(offset); offset += 4;

			if (offset < msg.length) e.posx = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.posy = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.posz = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.orw  = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.orx  = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.ory  = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.orz  = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.extraDataType  = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.extraDataItems = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.extraDataMask  = msg.readUInt32LE(offset); offset += 4;

			// Extra data types:
			//    0 ExtraDataNull,
			//    1 ExtraDataFloatArray,
			//    2 ExtraDataIntArray,
			//    3 ExtraDataVector3Array,
			//    4 ExtraDataString,
			//    5 ExtraDataKinectSpeech

			//var r_roll  = Math.asin(2.0*e.orx*e.ory + 2.0*e.orz*e.orw);
			//var r_yaw   = Math.atan2(2.0*e.ory*e.orw-2.0*e.orx*e.orz , 1.0 - 2.0*e.ory*e.ory - 2.0*e.orz*e.orz);
			//var r_pitch = Math.atan2(2.0*e.orx*e.orw-2.0*e.ory*e.orz , 1.0 - 2.0*e.orx*e.orx - 2.0*e.orz*e.orz);

			var posX = e.posx * omicronManager.totalWidth;
			var posY = e.posy * omicronManager.totalHeight;
			var sourceID = e.sourceId;

			// serviceType:
			//		0 = Pointer
			//		1 = Mocap
			//		2 = Keyboard
			//		3 = Controller
			//		4 = UI
			//		5 = Generic
			//		6 = Brain
			//		7 = Wand
			//		8 = Speech
			var serviceType = e.serviceType;
			//console.log("Event service type: " + serviceType);

			//console.log(e.sourceId, e.posx, e.posy, e.posz);
			// serviceID:
			// (Note: this depends on the order the services are specified on the server)
			//		0 = Touch
			//		1 = Classic SAGEPointer
			var serviceID = e.serviceId;

			var touchWidth  = 0;
			var touchHeight = 0;
			if( serviceID === 0 &&  e.extraDataItems >= 2 )
			{
				touchWidth  = msg.readFloatLE(offset); offset += 4;
				touchHeight = msg.readFloatLE(offset); offset += 4;
			}

			// Appending sourceID to pointer address ID
			var address = rinfo.address+":"+sourceID;

			// ServiceTypePointer //////////////////////////////////////////////////
			if (serviceType === 0)
			{
				if (omicronManager.eventDebug)
				{
					console.log("pointer ID "+ sourceID +" event! type: " + e.type  );
					console.log("pointer event! type: " + e.type  );
					console.log("ServiceTypePointer> source ", e.sourceId);
					console.log("ServiceTypePointer> serviceID ", e.serviceId);
				}

				// TouchGestureManager Flags:
				// 1 << 18 = User flag start (as of 8/3/14)
				// User << 1 = Unprocessed
				// User << 2 = Single touch
				// User << 3 = Big touch
				// User << 4 = 5-finger hold
				// User << 5 = 5-finger swipe
				// User << 6 = 3-finger hold
				var User = 1 << 18;

				var FLAG_SINGLE_TOUCH = User << 2;
				//var FLAG_BIG_TOUCH = User << 3;
				var FLAG_FIVE_FINGER_HOLD = User << 4;
				//var FLAG_FIVE_FINGER_SWIPE = User << 5;
				var FLAG_THREE_FINGER_HOLD = User << 6;
				var FLAG_SINGLE_CLICK = User << 7;
				var FLAG_DOUBLE_CLICK = User << 8;
				var FLAG_MULTI_TOUCH = User << 9;

				var initX = 0;
				var initY = 0;

				if( serviceID === 0  && e.extraDataItems >= 4 && e.type !== 15  ) // Type 15 = Zoom
				{
					initX = msg.readFloatLE(offset); offset += 4;
					initY = msg.readFloatLE(offset); offset += 4;

					initX *= omicronManager.totalWidth;
					initY *= omicronManager.totalHeight;
				}

				// if (e.type === 3)
				// {
				// 	// update (Used only by classic SAGE pointer)
				// 	if( e.sourceId in ptrs )
				// 		return;
				// 	colorpt = [Math.floor(e.posx*255.0), Math.floor(e.posy*255.0), Math.floor(e.posz*255.0)];
				// 	if (offset < msg.length)
				// 	{
				// 		if (e.extraDataType == 4 && e.extraDataItems > 0)
				// 		{
				// 			console.log("create touch pointer");
				// 			e.extraString = msg.toString("utf-8", offset, offset+e.extraDataItems);
				// 			ptrinfo = e.extraString.split(" ");
				// 			offset += e.extraDataItems;
				// 			ptrs[e.sourceId] = {id:e.sourceId, label:ptrinfo[0], ip:ptrinfo[1], mouse:[0,0,0], color:colorpt, zoom:0, position:[0,0], mode:0};
				// 			sio.sockets.emit('createPointer', {type: 'ptr', id: e.sourceId, label: ptrinfo[0], color: colorpt, zoom:0, position:[0,0], src: "resources/mouse-pointer-hi.png" });
				// 		}
				// }
				// else
				if (e.type === 4)
				{
					// move
					if( e.flags === FLAG_SINGLE_TOUCH )
					{
						if( omicronManager.gestureDebug )
						{
							console.log("Touch move at - ("+posX+","+posY+") initPos: ("+initX+","+initY+")" );
						}

						var distance = Math.sqrt( Math.pow( Math.abs(posX - initX), 2 ) + Math.pow( Math.abs(posY - initY), 2 ) );
						var angle = Math.atan2( posY -  initY, posX - initX );

						var accelDistance = distance * omicronManager.acceleratedDragScale;
						var accelX = posX + accelDistance * Math.cos(angle);
						var accelY = posY + accelDistance * Math.sin(angle);

						omicronManager.pointerPosition( address, { pointerX: accelX, pointerY: accelY } );
						omicronManager.pointerMove(address, accelX, accelY, { deltaX: 0, deltaY: 0, button: "left" } );
					}
					else if (e.flags === FLAG_FIVE_FINGER_HOLD)
					{
						if (omicronManager.gestureDebug)
						{
							console.log("Touch move gesture: Five finger hold - " + Date.now());
						}
						omicronManager.pointerCloseGesture( address, posX, posY, Date.now(), 1 );
					}
					else if( e.flags === FLAG_MULTI_TOUCH )
					{
						omicronManager.pointerPosition( address, { pointerX: posX, pointerY: posY } );
					}
				}
				else if (e.type === 15)
				{
					// zoom

					/*
					Omicron zoom event extra data:
					0 = touchWidth (parsed above)
					1 = touchHeight (parsed above)
					2  = zoom delta
					3 = event second type ( 1 = Down, 2 = Move, 3 = Up )
					*/
					// extraDataType 1 = float
					//console.log("Touch zoom " + e.extraDataType  + " " + e.extraDataItems );
					if (e.extraDataType === 1 && e.extraDataItems >= 4)
					{
						var zoomDelta = msg.readFloatLE(offset); offset += 4;
						var eventType = msg.readFloatLE(offset);  offset += 4;

						if( eventType === 1 ) // Zoom start/down
						{
							//console.log("Touch zoom start");
							omicronManager.pointerScrollStart( address, posX, posY );
						}
						else // Zoom move
						{
							if( omicronManager.gestureDebug )
								console.log("Touch zoom");
							omicronManager.pointerScroll( address, { wheelDelta: -zoomDelta * omicronManager.touchZoomScale } );
						}
					}

				}
				else if (e.type === 5) { // button down
					if( omicronManager.gestureDebug )
					{
						console.log("Touch down at - ("+posX+","+posY+") initPos: ("+initX+","+initY+") flags:" + e.flags);
					}

					if( e.flags === FLAG_SINGLE_TOUCH || e.flags === FLAG_MULTI_TOUCH )
					{
						// Create pointer
						if (address in omicronManager.sagePointers) {
							omicronManager.showPointer(address, { label:  "Touch: " + sourceID, color: "rgba(255, 255, 255, 1.0)", sourceType: "Touch" } );
						} else {
							omicronManager.createSagePointer(address);
							omicronManager.showPointer(address, { label:  "Touch: " + sourceID, color: "rgba(255, 255, 255, 1.0)", sourceType: "Touch" } );
							omicronManager.pointerPress(address, posX, posY, { button: "left" } );
						}
					}
					else if( e.flags === FLAG_FIVE_FINGER_HOLD )
					{
						if( omicronManager.gestureDebug )
						{
							console.log("Touch down gesture: Five finger hold - " + Date.now());
						}
						omicronManager.pointerCloseGesture( address, posX, posY, Date.now(), 0 );
					}
					else if( e.flags === FLAG_THREE_FINGER_HOLD )
					{
						if( omicronManager.gestureDebug )
						{
							console.log("Touch gesture: Three finger hold");
						}
						omicronManager.createRadialMenu( sourceID, posX, posY );
					}
					else if( e.flags === FLAG_SINGLE_CLICK )
					{
						if( omicronManager.gestureDebug )
						{
							console.log("Touch gesture: Click");
						}

					}
					else if( e.flags === FLAG_DOUBLE_CLICK )
					{
						if( omicronManager.gestureDebug )
						{
							console.log("Touch gesture: Double Click");
						}
						omicronManager.pointerDblClick( address, posX, posY );
					}
				}
				else if (e.type === 6)
				{ // button up
					if( e.flags === FLAG_SINGLE_TOUCH || e.flags === FLAG_MULTI_TOUCH )
					{
						// Hide pointer
						omicronManager.hidePointer(address);

						// Release event
						omicronManager.pointerRelease(address, posX, posY, { button: "left" } );

						if( omicronManager.gestureDebug )
						{
							//console.log("Touch release");
							console.log("Touch up at - ("+posX+","+posY+") initPos: ("+initX+","+initY+") flags:" + e.flags);
						}
					}
					else if( e.flags === FLAG_FIVE_FINGER_HOLD )
					{
						if( omicronManager.gestureDebug )
						{
							console.log("Touch up gesture: Five finger hold - " + Date.now());
						}
						omicronManager.pointerCloseGesture( address, posX, posY, Date.now(), 2 );
					}
				}
				else
				{
					console.log("\t UNKNOWN event type ", e.type);
				}

				if (emit>2) { dstart = Date.now(); emit = 0; }
			}
			// ServiceTypePointer ends ///////////////////////////////////////////

			// ServiceTypeWand //////////////////////////////////////////////////
			else if (serviceType === 7)
			{
				// Wand Button Flags
				//var button1 = 1;
				var button2 = 2; // Circle
				var button3 = 4; // Cross
				//var specialButton1 = 8;
				//var specialButton2 = 16;
				//var specialButton3 = 32;
				//var button4 = 64;
				var button5 = 128; // L1
				//var button6 = 256; // L3
				var button7 = 512; // L2
				var buttonUp = 1024;
				var buttonDown = 2048;
				var buttonLeft = 4096;
				var buttonRight = 8192;
				//var button8 = 32768;
				//var button9 = 65536;

				// Wand SAGE2 command mapping
				var clickDragButton = button3;
				var menuButton      = button2;
				var showHideButton  = button7;
				var scaleUpButton   = buttonUp;
				var scaleDownButton = buttonDown;
				var maximizeButton  = button5;
				var previousButton  = buttonLeft;
				var nextButton      = buttonRight;
				var playButton      = button2;

				//console.log("Wand Position: ("+e.posx+", "+e.posy+","+e.posz+")" );
				//console.log("Wand Rotation: ("+e.orx+", "+e.ory+","+e.orz+","+e.orw+")" );
				var screenPos = this.coordCalculator.wandToScreenCoordinates( e.posx, e.posy, e.posz, e.orx, e.ory, e.orz, e.orw );
				//console.log("Screen pos: ("+screenPos.x+", "+screenPos.y+")" );

				address = omicronManager.config.inputServerIP;

				//if( omicronManager.showPointerToggle === false )
				//	return;

				if (omicronManager.showPointerToggle && screenPos.x !== -1 && screenPos.y !== -1 )
				{
					var timestamp = e.timestamp/1000;

					posX = screenPos.x;
					posY = screenPos.y;

					// 1euro filter
					posX = omicronManager.wandXFilter.filter(screenPos.x, timestamp);
					posY = omicronManager.wandYFilter.filter(screenPos.y, timestamp);

					posX *= omicronManager.totalWidth;
					posY *= omicronManager.totalHeight;

					omicronManager.lastPosX = posX;
					omicronManager.lastPosY = posY;

					if( omicronManager.pointerOffscreen && omicronManager.showPointerToggle )
					{
						omicronManager.showPointer( omicronManager.config.inputServerIP, { label: omicronManager.wandLabel+" "+sourceID, color: omicronManager.wandColor } );
						omicronManager.pointerPosition( address, { pointerX: posX, pointerY: posY } );
						omicronManager.pointerOffscreen = false;
					}
				}
				else
				{
					posX = omicronManager.lastPosX;
					posY = omicronManager.lastPosY;

					if( !omicronManager.pointerOffscreen && omicronManager.showPointerToggle )
					{
						omicronManager.hidePointer( omicronManager.config.inputServerIP );
						omicronManager.pointerOffscreen = true;
					}
				}

				omicronManager.pointerPosition( address, { pointerX: posX, pointerY: posY } );

				/*
				if( wandObjectList[sourceID] === undefined )
				{
					wandObjectList[sourceID] = { id: sourceID, address: address, posX: posX, posY: posY, lastPosIndex: 0, prevPosX: [posX,-1,-1,-1,-1], prevPosY: [posY,-1,-1,-1,-1] };
				}
				else
				{
					var smoothingRange = 0;

					var wandData = wandObjectList[sourceID];
					var lastIndex = wandData.lastPosIndex+1;
					if( lastIndex === smoothingRange )
						lastIndex = smoothingRange;

					var prevPosX = wandData.prevPosX;
					var prevPosY = wandData.prevPosY;

					prevPosX[lastIndex] = posX;
					prevPosY[lastIndex] = posY;

					var avgX = posX;
					var avgY = posY;
					var validPos = 1;
					for( var i = 0; i < smoothingRange; i++ )
					{
						if( prevPosX[i] !== -1 && prevPosY[i] != -1 )
						{
							avgX += prevPosX[i];
							avgY += prevPosY[i];
							validPos++;
						}
					}

					avgX /= validPos;
					avgY /= validPos;

					wandObjectList[sourceID] = { id: sourceID, address: address, posX: avgX, posY: avgY, lastPosIndex: lastIndex, prevPosX: prevPosX, prevPosY: prevPosY };
					//console.log(wandObjectList[sourceID]);
				}
				*/
				if (e.flags !== 0)
				{
					//console.log("Wand flags: " + e.flags + " " + (omicronManager.lastWandFlags & playButton) );
					if ( (e.flags & clickDragButton) === clickDragButton )
					{
						if (omicronManager.lastWandFlags === 0)
						{
							// Click
							omicronManager.pointerPress( address, posX, posY, { button: "left" } );
						}
						else
						{
							// Drag
							console.log("wandPointer press - drag");
							//omicronManager.pointerMove( address, posX, posY, { button: "left" } );
						}
					}
					else if (omicronManager.lastWandFlags === 0 && (e.flags & menuButton) === menuButton)
					{
						omicronManager.pointerPress( address, posX, posY, { button: "right" } );
					}
					else if (omicronManager.lastWandFlags === 0 && (e.flags & showHideButton) === showHideButton)
					{
						if (!omicronManager.showPointerToggle)
						{
							omicronManager.showPointerToggle = true;
							omicronManager.showPointer( omicronManager.config.inputServerIP, { label:  omicronManager.wandLabel+" "+sourceID, color: omicronManager.wandColor } );
							omicronManager.pointerPosition( address, { pointerX: posX, pointerY: posY } );
						}
						else
						{
							omicronManager.showPointerToggle = false;
							//hidePointer( omicronManager.config.inputServerIP );
						}
					}
					else if (omicronManager.lastWandFlags === 0 && (e.flags & scaleUpButton) === scaleUpButton)
					{
						omicronManager.pointerScrollStart( address, posX, posY );

						// Casting the parameters to correct type
						omicronManager.pointerScroll( address, { wheelDelta: parseInt(-omicronManager.wandScaleDelta, 10) } );
					}
					else if (omicronManager.lastWandFlags === 0 && (e.flags & scaleDownButton) === scaleDownButton)
					{
						omicronManager.pointerScrollStart( address, posX, posY );

						// Casting the parameters to correct type
						omicronManager.pointerScroll( address, { wheelDelta: parseInt(omicronManager.wandScaleDelta, 10) } );
					}
					else if (omicronManager.lastWandFlags === 0 && (e.flags & maximizeButton) === maximizeButton)
					{
						omicronManager.pointerDblClick( address, posX, posY );
					}
					else if ((omicronManager.lastWandFlags & previousButton) === 0 && (e.flags & previousButton) === previousButton)
					{
						omicronManager.keyDown( address, posX, posY, { code: 37 } );
					}
					else if ((omicronManager.lastWandFlags & nextButton) === 0 && (e.flags & nextButton) === nextButton)
					{
						omicronManager.keyDown( address, posX, posY, { code: 39 } );
					}
					else if ((omicronManager.lastWandFlags & playButton) === 0  && (e.flags & playButton) === playButton)
					{
						omicronManager.keyPress( address, posX, posY, { code: 32 } );
					}

					omicronManager.lastWandFlags = e.flags;
				}
				else if (omicronManager.lastWandFlags !== 0)
				{
					// TODO: Add a smarter way of detecting press, drag, release from button flags
					if ((omicronManager.lastWandFlags & clickDragButton) === clickDragButton )
					{
						//console.log("wandPointer release");
						omicronManager.pointerRelease( address, posX, posY, { button: "left" } );

						omicronManager.lastWandFlags = 0;
					}
					else if( (omicronManager.lastWandFlags & showHideButton) === showHideButton )
					{
						omicronManager.lastWandFlags = 0;
					}
					else if( (omicronManager.lastWandFlags & scaleUpButton) === scaleUpButton )
					{
						omicronManager.lastWandFlags = 0;
					}
					else if( (omicronManager.lastWandFlags & scaleDownButton) === scaleDownButton )
					{
						omicronManager.lastWandFlags = 0;
					}
					else if( (omicronManager.lastWandFlags & maximizeButton) === maximizeButton )
					{
						omicronManager.lastWandFlags = 0;
					}
					else if( (omicronManager.lastWandFlags & previousButton) === previousButton )
					{
						omicronManager.lastWandFlags = 0;
						omicronManager.keyUp( address, posX, posY, { code: 37 } );
					}
					else if( (omicronManager.lastWandFlags & nextButton) === nextButton )
					{
						omicronManager.lastWandFlags = 0;
						omicronManager.keyUp( address, posX, posY, { code: 39 } );
					}
					else if( (omicronManager.lastWandFlags & playButton) === playButton )
					{
						omicronManager.lastWandFlags = 0;
						omicronManager.keyUp( address, posX, posY, { code: 32 } );
					}
				}
			} // ServiceTypeWand ends ///////////////////////////////////////////
		}
	});// end udp.on 'message'

	udp.on("listening", function () {
		var address = udp.address();
		console.log("UDP> listening " + address.address + ":" + address.port);
	});

	udp.bind(this.omicronDataPort);
};

module.exports = OmicronManager;
