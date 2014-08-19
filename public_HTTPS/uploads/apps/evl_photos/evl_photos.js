// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2014

////////////////////////////////////////
// simple photo slideshow
// Written by Andy Johnson - 2014
////////////////////////////////////////

// would be nice to be able to change the parameters for image directory and duration
// in the application itself

var evl_photos = SAGE2_App.extend( {
    construct: function() {
        arguments.callee.superClass.construct.call(this);

    this.resizeEvents = "continuous"; //onfinish
    this.svg = null;

    this.canvasBackground = "black";

    this.canvasWidth = 800;
    this.canvasHeight = 600;

    this.sampleSVG = null;

    this.loadTimer = 200;

    this.URL1 = "";
    this.URL1a = "";
    this.URL1b = "";

    this.today = "";
    this.timeDiff = 0;

    this.bigList = null;

    this.okToDraw = 10;
    this.counter = 1;
    this.forceRedraw = 1;

    this.fileName = "";
    this.listFileName = "";

    this.appName = "evl_photos:";

    this.image1 = "NULL";
    this.image2 = "NULL";
    this.image3 = "NULL";

    this.updateCounter = 0;

    this.listFileNamePhotos = "";
    this.listFileNameLibrary = "";


    this.albums = [];
    this.albums[0] = {list:"http://lyra.evl.uic.edu:9000/evl_Pictures/photos.txt",
            location:"http://lyra.evl.uic.edu:9000/evl_Pictures/"};
    this.albums[1] = {list:"http://lyra.evl.uic.edu:9000/webcam2.txt",
            location:"ftp://ftp.evl.uic.edu/pub/INcoming/spiff/"};
    this.albums[2] = {list:"http://lyra.evl.uic.edu:9000/webcam3.txt",
            location:"http://www.glerl.noaa.gov/metdata/cams/"};
    this.albums[3] = {list:"http://lyra.evl.uic.edu:9000/posters/photos.txt",
            location:"http://lyra.evl.uic.edu:9000/posters/"};

    this.state.imageSet = null;
 },

////////////////////////////////////////

chooseImagery: function(selection)
{
    this.listFileNamePhotos = this.albums[selection].list;
    this.listFileNameLibrary = this.albums[selection].location;
    },

////////////////////////////////////////

initApp: function()
{
    this.listFileCallbackFunc = this.listFileCallback.bind(this);
    this.imageLoadCallbackFunc = this.imageLoadCallback.bind(this);
    this.imageLoadFailedCallbackFunc = this.imageLoadFailedCallback.bind(this);

    this.chooseImagery(this.state.imageSet);

    this.loadInList();
    this.newImage();
},

////////////////////////////////////////

imageLoadCallback: function()
    {
    this.okToDraw = 10.0;
    this.image1 = this.image3; // image1 is now the new image
    console.log("imageLoadCallback");
    this.newImage();
    },

imageLoadFailedCallback: function()
    {
    console.log(this.appName + "image load failed on " + this.fileName);
    this.newImage();
    this.update();
    },

////////////////////////////////////////

listFileCallback: function(error, data)
{
    if(error)
        {
        console.log(this.appName + "listFileCallback - error");
        return;
        }

   if(data === null)
        {
        console.log(this.appName + "list of photos is empty");
        return;
        }

    this.bigList = d3.csv.parse(data);
    console.log(this.appName + "loaded in list of " + this.bigList.length + " images" );

    this.newImage();
    this.update();
    this.drawEverything();
},

////////////////////////////////////////

drawEverything: function ()
{
    if ((this.okToDraw > -10) || (this.forceRedraw > 0))
        {
        this.sampleSVG.selectAll("*").remove(); 
        this.forceRedraw = 0;

    var newWidth = this.canvasWidth;
    var newHeight = this.canvasHeight;


        this.sampleSVG.append("svg:rect")
            .style("stroke", "black")
            .style("fill", "black")
            .style("fill-opacity", 1.0)
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", newHeight)
            .attr("width", newWidth);

        if (this.image2 != "NULL") // previous image
        {
            if (this.okToDraw > 1)
                this.sampleSVG.append("svg:image")
                .attr("xlink:href", this.image2.src)
                .attr("opacity", 1) //(this.okToDraw * 0.1))
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", this.canvasWidth)
                .attr("height", this.canvasHeight);
            else
                this.sampleSVG.append("svg:image")
                .attr("xlink:href", this.image2.src)
                .attr("opacity", (this.okToDraw+9) * 0.1) 
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", this.canvasWidth)
                .attr("height", this.canvasHeight);
        }

        if (this.image1 != "NULL") // current image
            this.sampleSVG.append("svg:image")
            .attr("xlink:href", this.image1.src)
            .attr("opacity", 1.0 - (this.okToDraw * 0.1))
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.canvasWidth)
            .attr("height", this.canvasHeight);

        this.okToDraw -= 1.0;
        }

    this.updateCounter += 1;
    if (this.updateCounter > this.loadTimer)
        {
            this.update();
            this.updateCounter = 0;
        }
},  

////////////////////////////////////////

loadInList: function ()
{
    this.listFileName = this.listFileNamePhotos;
    d3.text(this.listFileName, this.listFileCallbackFunc);

//    readFile(this.listFileName, this.listFileCallbackFunc);
},

////////////////////////////////////////

newImage: function ()
{
    if (this.bigList === null)
        this.counter = 0;
    else
        this.counter = Math.floor(Math.random() * this.bigList.length);
},

////////////////////////////////////////

update: function ()
{
    if (this.bigList === null)
    {
        console.log(this.appName + "list of photos not populated yet");
        return;
    }

    if (this.bigList[this.counter] === null)
        {   
        console.log(this.appName + "cant find filename of image number "+this.counter);
        this.newImage();
        this.update(); // potential for infinite loop here
        return;
        }

    // escape makes a string url-compatible
    // except for ()s, commas, &s, and odd characters like umlauts and graves

    // this also appends a random number to the end of the request to avoid browser caching
    // in case this is a single image repeatedly loaded from a webcam
    this.fileName = this.listFileNameLibrary + escape(this.bigList[this.counter].name) + '?' + Math.floor(Math.random() * 10000000);
 
    this.image2 = this.image1; // image2 is the previous image

    this.image3 = new Image;
    this.image3.src = this.fileName;

    this.image3.onload = this.imageLoadCallbackFunc;
    this.image3.onerror = this.imageLoadFailedCallbackFunc;
/*
    var me = this;
    var extension = this.fileName.substring(this.fileName.lastIndexOf(".") +1, this.fileName.length).toLowerCase();
    if (extension === "jpg")
        extension = "jpeg";

    console.log(extension);
    readFile(this.fileName,function(error, data){
        me.image3 = new Image; // image3 stores new image while its being loaded in
        //me.image3.src = this.fileName;
        me.image3.src = "data:image/"+extension+";base64,"+btoa(data);

        me.image3.onload = this.imageLoadCallbackFunc;
        me.image3.onerror = this.imageLoadFailedCallbackFunc;
        })
*/
},

////////////////////////////////////////

updateWindow: function (){

    x = this.element.clientWidth;
    y = this.element.clientHeight;

    this.canvasWidth = x;
    this.canvasHeight = y;

    var newWidth = this.canvasWidth;
    var newHeight = this.canvasHeight;

    var box="0,0,"+newWidth+","+newHeight;
    this.sampleSVG.attr("width", x) 
        .attr("height", y) 
        .attr("viewBox", box)
        .attr("preserveAspectRatio", "xMinYMin meet");

    // want a black backdrop to add images on top of
 /*   this.sampleSVG.append("svg:rect")
        .style("stroke", "black")
        .style("fill", "black")
        .style("fill-opacity", 1.0)
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", newHeight)
        .attr("width", newWidth);
*/

    this.forceRedraw = 1;
    this.drawEverything(); // need this to keep image while scaling etc
},

////////////////////////////////////////

    init: function(id, width, height, resrc, date) {
		// call super-class 'init'
		arguments.callee.superClass.init.call(this, id, "div", width, height, resrc, date);

        this.maxFPS = 10.0;

		// Get width height from the supporting div		
		//var divWidth  = this.element.clientWidth;
		//var divHeight = this.element.clientHeight;

		this.element.id = "div" + id;

		// backup of the context
		var self = this;

        var newWidth = this.canvasWidth;
        var newHeight = this.canvasHeight;


		// attach the SVG into the this.element node provided to us
		var box="0,0,"+newWidth+","+newHeight;
		this.svg = d3.select(this.element).append("svg:svg")
		    .attr("width",   width)
		    .attr("height",  height)
		    .attr("viewBox", box)
            .attr("preserveAspectRatio", "xMinYMin meet"); // new
		this.sampleSVG = this.svg;

        this.state.imageSet= 0;


	},

	load: function(state, date) {
        console.log("looking for a state", state);
        if (state){
            console.log("I have state " + state)
            this.state.imageSet = state.imageSet;
            }
        else {
            this.state.imageSet = 0; // which album
            }

        this.initApp();

        this.update();
        this.draw_d3(date);
	},

	draw_d3: function(date) {
        this.updateWindow();
	},
	
	draw: function(date) {
	    
        this.drawEverything();
	},

	resize: function(date) {
		this.svg.attr('width' ,  this.element.clientWidth  +"px");
		this.svg.attr('height' , this.element.clientHeight  +"px");

        this.updateWindow();
		this.refresh(date);
	},

    event: function(eventType, pos, user, data, date) {
    //event: function(eventType, userId, x, y, data, date) {
        if (eventType === "pointerPress" && (data.button === "left") ) {
        }
        if (eventType === "pointerMove" ) {
        }
        if (eventType === "pointerRelease" && (data.button === "left") ) {
            this.bigList = null;
            this.state.imageSet += 1;
            if (this.state.imageSet >= this.albums.length)
                this.state.imageSet = 0;
            this.chooseImagery(this.state.imageSet);
            this.loadInList();
        }
    }
	
});

