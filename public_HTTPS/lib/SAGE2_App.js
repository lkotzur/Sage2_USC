// SAGE2 is available for use under the following license, commonly known
//          as the 3-clause (or "modified") BSD license:
//
// Copyright (c) 2014, Electronic Visualization Laboratory,
//                     University of Illinois at Chicago
// All rights reserved.
//
// http://opensource.org/licenses/BSD-3-Clause
// See included LICENSE.txt file


// New seeded Math.random function
Math.seed = function(s) {
    Math.random = function() {
        s = Math.sin(s) * 10000; return s - Math.floor(s);
    }
};

var SAGE2_App = Class.extend( {
	construct: function() {
		this.div = null;
		this.element = null;
		this.resrcPath = null;
		this.resizeEvents = "never";
	
		this.startDate = null;
		this.prevDate = null;
	
		this.t = null;
		this.dt = null;
		this.frame = null;
	},
	
	init: function(id, elem, width, height, resrc, date) {
		this.div = document.getElementById(id);
		this.element = document.createElement(elem);
		this.element.className = "sageItem";
                if (elem === "div") {
                        this.element.style.width = width + "px";
                        this.element.style.height = height + "px";
                } else {
                        this.element.width = width;
                        this.element.height = height;
                }
		this.div.appendChild(this.element);
		console.log("created " + elem);
		console.log(this.element);
		
		this.resrcPath = resrc + "/";
		this.startDate = date;
		this.prevDate = date;
		this.frame = 0;
		// Seed the number generator based on current time
		Math.seed(date.getTime());
	},
	
	preDraw: function(date) {
		this.t = (date.getTime() - this.startDate.getTime()) / 1000; // total time since start of program (sec)
		this.dt = (date.getTime() - this.prevDate.getTime()) / 1000; // delta time since last frame (sec)
	},
	
	postDraw: function(date) {
		this.prevDate = date;
		this.frame++;
	},
});


