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
 * @module registry
 */

var fs          = require('fs');
var json5       = require('json5');
var path        = require('path');

function registryManager(registryFile) {
    this.defaultApp = {};
    this.fileTypeToApp = {};

    console.log("Registry> Building registry!");

    this.readDefaultAppFile();

    var jsonString = fs.readFileSync(registryFile, 'utf8');
    var jsonRegistry = json5.parse(jsonString);

    if (jsonRegistry.apps !== undefined && jsonRegistry.apps !== null && Array.isArray(jsonRegistry.apps) ) {
        for(var i=0; i<jsonRegistry.apps.length; i++) {
            var app = jsonRegistry.apps[i];
            if (app.name !== undefined && app.name !== null && app.name !== "" &&
                app.fileTypes !== undefined && app.fileTypes !== null && Array.isArray(app.fileTypes) ) {

                console.log("Registry> Found app: " + app.name);
                console.log("Registry> [" + app.name + "] Supported FileTypes: " + app.fileTypes);

                for(var j=0; j<app.fileTypes.length; j++) {
                    this.fileTypeToApp[app.fileTypes] = app.name;
                }
            }
        }
    }
}

registryManager.prototype.readDefaultAppFile = function() {
    console.log("Registry> Reading default app file...");
    var jsonString = fs.readFileSync("defaultApps.json", 'utf8');
    var jsonDefApps = json5.parse(jsonString);

    if (jsonDefApps.defaultApps !== undefined &&
        jsonDefApps.defaultApps !== null &&
        Array.isArray(jsonDefApps.defaultApps) ) {
        for(var i=0; i<jsonDefApps.defaultApps.length; i++) {
            var defApp =  jsonDefApps.defaultApps[i];
            this.defaultApp[defApp.fileType] = defApp.app;
            console.log("Registry> Registering: " + defApp.fileType + " with " + defApp.app);
        }
    }
}

registryManager.prototype.registerFileType = function() {

}

registryManager.prototype.removeFileType = function() {

}

registryManager.prototype.makeDefault = function() {

}

module.exports = registryManager;
