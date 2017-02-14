// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2014-16

//

/* global d3 */
"use strict";

var SAGE2Viz = SAGE2_App.extend({
  init: function(data) {
    console.log(data);

    this.SAGE2Init("div", data);


    // get file name and type
    var re = /.*\/(.+)\.(\w*)/;
    var arr = re.exec(this.state.file);

    this.element.id = "div" + data.id;

    this.resizeEvents = /* "onfinish"; */ "continuous";

    this.div = d3.select("#" + this.element.id)
      .style("font-family", "Helvetica sansserif")
      .style("box-sizing", "border-box")
      .style("padding", "10px");

    this.components = {};

    // show the title of the file
    this.components.fileTitle = this.div.append("div")
      .attr("class", "fileTitleDiv")
      .attr("width", "100%")
      .style("overflow", "hidden")
      .style("font-size", "65px")
      .style("font-weight", "bold")
      .style("background", "#444")
      .style("border", "3px solid #666")
      .style("border-radius", "10px")
      .style("padding", "8px")
      .style("margin", "5px")
    .append("p")
      .style("color", "#AAA")
      .text(arr[1]);

    // show the type of the file
    this.components.fileType = this.div.append("div")
      .attr("class", "fileTitleDiv")
      .attr("width", "100%")
      .style("overflow", "hidden")
      .style("font-size", "50px")
      // .style("font-weight", "bold")
      .style("background", "#444")
      .style("border", "3px solid #666")
      .style("border-radius", "10px")
      .style("padding", "8px")
      .style("margin", "5px")
    .append("p")
      .style("color", "#AAA")
      .text(arr[2].toUpperCase());

    this.components.dataTypes = this.div.selectAll(".dataType");

    console.log("creating controls");
    this.controls.addButton({label: "Mode",  position: 1,  identifier: "ModeToggle"});

    this.controls.finishedAddingControls();

    // this.load_csv(data.date);

    // create visualization serverside
    this.updateServer(data);

    this.updateTitle("SAGE2 Viz Dataset");
  },

  updateDataDefinition: function(data) {
    this.dataDefinition = data;

    console.log(this.dataDefinition);

    // remove all
    this.components.dataTypes.remove();

    // add new list
    this.components.dataTypes
      .data(this.dataDefinition)
    .enter().append("div")
      .attr("class", "dataType")
      .attr("width", "100%")
      .style("overflow", "hidden")
      .style("font-size", "35px")
      // .style("font-weight", "bold")
      .style("background", "#444")
      .style("border", "3px solid #666")
      .style("border-radius", "10px")
      .style("padding", "8px")
      .style("margin", "5px")
    .append("p")
      .style("color", "#AAA")
      .text((d) => (d.type + " : \"" + d.name + "\""));
  },

  updateServer: function(data) {
    wsio.emit('createVisualization', {id: data.id, filePath: this.state.file});
  },

  load: function(date) {
    // empty
  },

  draw_d3: function(date) {

    var width  = this.element.clientWidth;
    var height = this.element.clientHeight;

    // draw stuff

  },

  draw: function(date) {

  },

  resize: function(date) {

    this.refresh(date);
    this.draw_d3(date);
  },

  getContextEntries: function() {
    var separator = {
      description: "separator"
    };

    var contextMenuEntries = [
      {
        description: "Create ",
        callback: "loadNodeLinkApp",
        parameters: {}
      }
    ];

    return contextMenuEntries;
  },

  event: function(eventType, position, user_id, data, date) {

    if (eventType === "pointerPress" && (data.button === "left")) {
      // press

    }
    if (eventType === "pointerMove") {
      // scale the coordinate by the viewbox (coordinate system)
      // var scalex = this.box[0] / this.element.clientWidth;
      // var scaley = this.box[1] / this.element.clientHeight;
    }
    if (eventType === "pointerRelease" && (data.button === "left")) {
      // release
    }
    if (eventType === "widgetEvent") {
      if (data.identifier === "NextValPrim") {
        this.incrementPrimary({val: 1});
      } else if (data.identifier === "PrevValPrim") {
        this.incrementPrimary({val: -1});
      } else if (data.identifier === "SortToggle") {
        this.toggleSort();
      } else if (data.identifier === "NextValSec") {
        this.incrementSecondary({val: 1});
      } else if (data.identifier === "PrevValSec") {
        this.incrementSecondary({val: -1});
      } else if (data.identifier === "ModeToggle") {
        this.modeToggle();
      } else if (data.identifier === "FirstColToggle") {
        this.toggleUseFirstColumn();
      }
    }
  },

  loadNodeLinkApp: function() {
    if (isMaster) {
      wsio.emit('loadApplication', {application: "C:\\Users\\andre\\Documents\\sage2\\public\\uploads\\apps\\nodelink", user: "SAGE2", parent: this.id});
    }
  }

});
