function SAGE2DisplayUI() {
	this.init = function(config, wsio) {
		var _this = this;
		this.config = config;
		this.wsio = wsio;
		this.scale = 1.0;
		this.logo = new Image();
		this.logo.onload = function(event) {
			_this.resize();
		};
		this.logo.src = "images/EVL-LAVA_UI.svg"
		this.logoAspect = 3.47828052509;
		this.fileDrop = false;
		this.fileDropFontSize = 12;
		
		this.applications = [];
		this.pointerX = 0;
		this.pointerY = 0;
	};
	
	this.draw = function() {
		var i;
		var sage2UI = document.getElementById('sage2UI');
		var ctx = sage2UI.getContext('2d');
		
		// background
		ctx.fillStyle = "rgba(180, 180, 180, 1.0)";
		ctx.fillRect(0, 0, sage2UI.width, sage2UI.height);
		
		var logoX, logoY, logoW, logoH;
		if((sage2UI.width/sage2UI.height) <= this.logoAspect){
			logoW = sage2UI.width * 0.75;
			logoH = logoW / this.logoAspect;
		}
		else {
			logoH = sage2UI.height * 0.75;
			logoW = logoH * this.logoAspect;
		}
		logoX = sage2UI.width/2  - logoW/2;
		logoY = sage2UI.height/2 - logoH/2;
		ctx.drawImage(this.logo, logoX, logoY, logoW, logoH);
		
		// applications
		for(i=0; i<this.applications.length; i++){
			// item
			ctx.fillStyle = "rgba(230, 230, 230, 1.0)";
			ctx.lineWidth = 2;
			ctx.strokeStyle = "rgba(108, 108, 108, 1.0)";
		
			var tLeft   = this.applications[i].left * this.scale;
			var tTop    = (this.applications[i].top) * this.scale;
			var tWidth  = this.applications[i].width * this.scale;
			var tHeight = this.config.ui.titleBarHeight * this.scale;
		
			ctx.fillRect(tLeft, tTop, tWidth, tHeight);
			ctx.strokeRect(tLeft, tTop, tWidth, tHeight);
			
			ctx.fillStyle = "rgba(72, 72, 72, 1.0)";
			
			var eLeft   =  this.applications[i].left * this.scale;
			var eTop    = (this.applications[i].top+this.config.ui.titleBarHeight) * this.scale;
			var eWidth  =  this.applications[i].width * this.scale;
			var eHeight =  this.applications[i].height * this.scale;
			
			ctx.fillRect(eLeft, eTop, eWidth, eHeight);
			ctx.strokeRect(eLeft, eTop, eWidth, eHeight);
			
			var size = 0.85*Math.min(eWidth, eHeight);
			var x = eLeft + (eWidth/2) - (size/2);
			var y = eTop + (eHeight/2) - (size/2);
			
			ctx.drawImage(this.applications[i].icon, x, y, size, size);
		}
		
		// tiled display layout
		ctx.lineWidth = 2;
		ctx.strokeStyle = "rgba(86, 86, 86, 1.0)";
		var stepX = sage2UI.width/this.config.layout.columns;
		var stepY = sage2UI.height/this.config.layout.rows;
		ctx.beginPath();
		for(i=1; i<this.config.layout.columns; i++){
			ctx.moveTo(i*stepX, 0);
			ctx.lineTo(i*stepX, sage2UI.height);
		}
		for(i=1; i<this.config.layout.rows; i++){
			ctx.moveTo(0, i*stepY);
			ctx.lineTo(sage2UI.width, i*stepY);
		}
		ctx.closePath();
		ctx.stroke();
		
		// file drop overlay
		if(this.fileDrop === true){
			ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
			ctx.fillRect(0, 0, sage2UI.width, sage2UI.height);
			
			var txt = "Drop multimedia files here";
			ctx.font = this.fileDropFontSize + "px Verdana";
			var txtWidth = ctx.measureText(txt).width;
			
			var textBoxWidth = Math.round(sage2UI.width*0.75);
			var lines = this.textLineCount(ctx, txt, textBoxWidth);
			var lineHeight = this.fileDropFontSize * 1.2;
			var textBoxHeight = lineHeight * lines;
			
			var textBoxX = (sage2UI.width-textBoxWidth) / 2;
			var textBoxY = (sage2UI.height-textBoxHeight) / 2;
			var textBoxRadius = this.fileDropFontSize * 0.5;
			ctx.textAlign = "center";
			ctx.fillStyle = "rgba(86, 86, 86, 0.7)";
			this.drawRoundedRect(ctx, textBoxX, textBoxY, textBoxWidth, textBoxHeight, textBoxRadius, true, false);
			
			var textStartX = sage2UI.width/2 + this.fileDropFontSize*0.175;
			var textStartY = sage2UI.height/2 - ((lines-1)/2)*lineHeight + this.fileDropFontSize*0.333;
			ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
			this.wrapText(ctx, txt, textStartX, textStartY, textBoxWidth, lineHeight);
		}
	};
	
	this.addAppWindow = function(data) {
		var icon = data.icon;
		data.icon = new Image();
		var _this = this;
		data.icon.onload = function() {
			_this.draw();
		};
		if(icon) data.icon.src = icon+"_512.png";
		else data.icon.src = "images/blank.png";
		this.applications.push(data);
	};
	
	this.deleteApp = function(id) {
		var selectedIndex;
		var selectedItem;
		var i;
		for(i=0; i<this.applications.length; i++){
			if(this.applications[i].id === id){
				selectedIndex = i;
				selectedItem = this.applications[i];
				break;
			}
		}
		for(i=selectedIndex; i<this.applications.length-1; i++){
			this.applications[i] = this.applications[i+1];
		}
		this.applications[this.applications.length-1] = selectedItem;
		this.applications.pop();
		this.draw();
	};
	
	this.updateItemOrder = function(order) {
		var i;
		var j;
		for(i=0; i<order.length; i++){
			for(j=0; j<this.applications.length; j++){
				if(this.applications[j].id === order[i]){
					var tmp = this.applications[i];
					this.applications[i] = this.applications[j];
					this.applications[j] = tmp;
				}
			}
		}
		this.draw();
	};
	
	this.setItemPosition = function(position_data) {
		var i;
		for(i=0; i<this.applications.length; i++){
			if(this.applications[i].id === position_data.elemId){
				this.applications[i].left = position_data.elemLeft;
				this.applications[i].top = position_data.elemTop;
				break;
			}
		}
		this.draw();
	};
	
	this.setItemPositionAndSize = function(position_data) {
		var i;
		for(i=0; i<this.applications.length; i++){
			if(this.applications[i].id === position_data.elemId){
				this.applications[i].left = position_data.elemLeft;
				this.applications[i].top = position_data.elemTop;
				this.applications[i].width = position_data.elemWidth;
				this.applications[i].height = position_data.elemHeight;
				break;
			}
		}
		this.draw();
	};
	
	this.drawRoundedRect = function(ctx, x, y, width, height, radius, fillFlag, strokeFlag) {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		if(fillFlag === true) ctx.fill();
		if(strokeFlag === true) ctx.stroke();
	};
	
	this.textLineCount = function(ctx, text, maxWidth) {
		var words = text.split(" ");
		var line = "";
		var count = 1;

		for(var n=0; n<words.length; n++) {
			var testLine = line + words[n] + " ";
			var testWidth = ctx.measureText(testLine).width;
			if(testWidth > maxWidth && n > 0) {
				line = words[n] + ' ';
				count++;
			}
			else {
				line = testLine;
			}
		}
		return count;
	};
	
	this.wrapText = function(ctx, text, x, y, maxWidth, lineHeight) {
		var words = text.split(" ");
		var line = "";

		for(var n=0; n<words.length; n++) {
			var testLine = line + words[n] + " ";
			var testWidth = ctx.measureText(testLine).width;
			if(testWidth > maxWidth && n > 0) {
				ctx.fillText(line, x, y);
				line = words[n] + ' ';
				y += lineHeight;
			}
			else {
				line = testLine;
			}
		}
		ctx.fillText(line, x, y);
	};
	
	this.pointerPress = function(btn) {
		if(btn !== "right"){
			this.wsio.emit('pointerPress', {button: btn});
		}
	};
	
	this.pointerRelease = function(btn) {
		if(btn !== "right"){
			this.wsio.emit('pointerRelease', {button: btn});
		}
	};
	
	this.pointerMove = function(x, y) {
		this.pointerX = x;
		this.pointerY = y;
		var globalX = this.pointerX / this.scale;
		var globalY = this.pointerY / this.scale;
		this.wsio.emit('pointerPosition', {pointerX: globalX, pointerY: globalY});
	};
	
	this.pointerScroll = function(value) {
		this.wsio.emit('pointerScrollStart');
		this.wsio.emit('pointerScroll', {wheelDelta: value});
	};
	
	this.pointerDblClick = function() {
		this.wsio.emit('pointerDblClick');
	};
	
	this.keyDown = function(keyCode) {
		if(keyCode !== 27) {
			this.wsio.emit('keyDown', {code: keyCode});
			if(keyCode === 9) { // tab is a special case - must emulate keyPress event
				this.wsio.emit('keyPress', {code: keyCode, character: String.fromCharCode(keyCode)});
			}
			// if a special key - prevent default (otherwise let continue to keyPress)
			if(keyCode <= 7 || (keyCode >= 10 && keyCode <= 15) || keyCode === 32 || (keyCode >= 47 && keyCode <= 90) || (keyCode >= 94 && keyCode <= 111) || keyCode >= 146) {
				return false;
			}
		}
		return true;
	};
	
	this.keyUp = function(keyCode) {
		if(keyCode !== 27) {
			this.wsio.emit('keyUp', {code: keyCode});
		}
		return true;
	};
	
	this.keyPress = function(charCode) {
		this.wsio.emit('keyPress', {code: charCode, character: String.fromCharCode(charCode)});
		return true;
	}
	
	this.resize = function() {
		var displayUI = document.getElementById('displayUI');
		var sage2UI = document.getElementById('sage2UI');
		var ctx = sage2UI.getContext('2d');
		var menuUI = document.getElementById('menuUI');
		
		var freeWidth   = window.innerWidth  - menuUI.offsetWidth - 30; // size of menu buttons
		var freeHeight  = window.innerHeight - 20;                 // size of 10px margin (top, bottom)
		
		var sage2Aspect = this.config.totalWidth / this.config.totalHeight;
		var freeAspect  = freeWidth / freeHeight;
		
		// wide sage2 display (compared to page)
		if(freeAspect < sage2Aspect) {
			sage2UI.width  = Math.floor(freeWidth);
			sage2UI.height = Math.floor(freeWidth / sage2Aspect);
			displayUI.style.marginLeft  = Math.floor((freeWidth-sage2UI.width) / 2 + 10).toString() + "px";
			displayUI.style.marginTop = "10px";
			menuUI.style.marginTop = ((sage2UI.height/2) - (menuUI.offsetHeight/2) + 10).toString() + "px";
		}
		// tall sage2 display (compared to page)
		else {
			sage2UI.height = Math.floor(freeHeight);
			sage2UI.width  = Math.floor(freeHeight * sage2Aspect);
			displayUI.style.marginLeft  = Math.floor((freeWidth-sage2UI.width) / 2 + 10).toString() + "px";
			displayUI.style.marginTop = "10px";
			menuUI.style.marginTop = ((sage2UI.height/2) - (menuUI.offsetHeight/2) + 10).toString() + "px";
		}
		if(sage2UI.height < menuUI.offsetHeight) {
			var dTop = (menuUI.offsetHeight-sage2UI.height) / 2;
			var mTop = 0;
			if(dTop < 10) {
				mTop = 10-dTop;
				dTop = 10;
			}
			displayUI.style.marginTop = dTop.toString() + "px";
			menuUI.style.marginTop = mTop.toString() + "px";
		}
		
		var minDim = Math.min(sage2UI.width, sage2UI.height);
		this.fileDropFontSize = Math.round(minDim * 0.075);
		
		this.scale = sage2UI.width / this.config.totalWidth;
		
		this.draw();
	};
}