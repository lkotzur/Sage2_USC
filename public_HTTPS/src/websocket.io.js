// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2014

function websocketIO(url) {
	this.ws = null;
	if(url !== undefined && url !== null) this.url = url;
	else this.url = (window.location.protocol === "https:" ? "wss" : "ws") + "://" + window.location.host + "/" + window.location.pathname.split("/")[1];
	this.messages = {};
	
	this.open = function(callback) {
		var _this = this;
		
		console.log(this.url);
		this.ws = new WebSocket(this.url);
		this.ws.binaryType = "arraybuffer";
		this.ws.onopen = callback;
		
		this.ws.onmessage = function(msg) {
			if(typeof msg.data === "string"){
				var message = JSON.parse(msg.data);
				if(message.func in _this.messages){
					_this.messages[message.func](message.data);
				}
			}
			else{
				var uInt8 = new Uint8Array(msg.data);
				
				var cchar = String.fromCharCode(uInt8[0]);
				var func = "";
				var i = 1;
				
				while(cchar !== "|"){
					func += cchar;
					cchar = String.fromCharCode(uInt8[i]);
					i++;
				}
				
				var buffer = uInt8.subarray(i, uInt8.length);
				_this.messages[func](buffer);
			}
		};
		// triggered by unexpected close event
		this.ws.onclose = function(evt) {
			console.log("wsio closed");
			if('close' in _this.messages)
				_this.messages['close'](evt);
		};
	};
	
	this.on = function(name, callback) {
		this.messages[name] = callback;
	};
	
	this.emit = function(name, data) {
		if(name === null || name === ""){
			console.log("Error: no message name specified");
			return;
		}
	
		// send binary data as array buffer
		if(data instanceof Uint8Array){
			var start = Date.now();
		
			name += "|";
			var funcName = new Uint8Array(name.length);
			for(var i=0; i<name.length; i++){
				funcName[i] = name.charCodeAt(i);
			}
			var message = new Uint8Array(funcName.length + data.length);
			message.set(funcName, 0);
			message.set(data, funcName.length);
			var end = Date.now();
			
			this.ws.send(message.buffer);
		}
		// send data as JSON string
		else {
			var message = {func: name, data: data};
			this.ws.send(JSON.stringify(message));
		}
	};

	// deliberate close function
	this.close = function() {
	    this.ws.onclose = function () {}; // disable onclose handler first
    	this.ws.close();
    };

}
