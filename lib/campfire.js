/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var request = require('request');

// pull variables from environment
var campfireName = process.env.CAMPFIRE_NAME;
var campfireRoom = process.env.CAMPFIRE_ROOM;
var campfireToken = process.env.CAMPFIRE_TOKEN;

var authString = "Basic " + new Buffer(campfireToken + ":X").toString("base64");
var campfireURI = 'https://' + campfireName + '.campfirenow.com';

// post a message to the given campfire room
var postMessage = function (message, callback) {
    if (campfireToken) {
        request.post(
            {
                uri: campfireURI + '/room/' + campfireRoom + '/speak.json',
                json: {message: {body: message}},
                headers: { "Authorization": authString}
            },
            callback
        );
    } else {
        console.log("Campfire (not enabled): " + message);
    }
};

var joinRoom = function (callback) {
    if (campfireToken) {
        request.post(
            {
                uri: campfireURI + '/room/' + campfireRoom + '/join.json',
                headers: { "Authorization": authString}
            },
            callback
        );
    } else {
        console.log("Campfire (not enabled): joined room.");
    }
};

// Say hello on app startup.
postMessage("MonkeyCruncher dashboard-server online: " + process.env.PORT);

exports.joinRoom = joinRoom;
exports.postMessage = postMessage;