/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var request = require('request');

var editServerURL = process.env.EDIT_SERVER_URL || "http://edit-server.localhost:5050/";
var sharedSecret = process.env.SHARED_SECRET || "a secret for inter-app communication";

exports.url = editServerURL;

// This checks the request body to see if it contains the shared secret, identifying the caller as the edit-server.
exports.requireEditServer = function (request, response, next) {
    if (request.body.secret !== sharedSecret) response.json({status: "You are not an authorized admin app."});
    else next();
};

// TODO: this method of passing the secret directly is pretty rough.
exports.create = function (uuid, callback) {
    postToEditServer(
        editServerURL + 'worksheets/create/' + encodeURIComponent(uuid),
        callback
    );
};

exports.authorize = function (token, uuid, callback) {
    postToEditServer(
        editServerURL + 'authorize/' + encodeURIComponent(uuid) + '/' + encodeURIComponent(token),
        callback
    );
};

exports.delete = function (uuid, callback) {
    postToEditServer(
        editServerURL + 'worksheets/delete/' + encodeURIComponent(uuid),
        callback
    );
};

var postToEditServer = function (url, callback) {
    request.post({uri: url, json: {secret: sharedSecret}}, function (err, response, body) {
        if (!body || !body.status) return callback(new Error("No meaningful response from edit-server."));
        if (body.status !== "ok") return callback(body.status);
        if (err) return callback(err);
        else callback();
    });
};
