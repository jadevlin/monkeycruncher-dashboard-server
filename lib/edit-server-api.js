/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var request = require('request'),
    logging = require('monkeycruncher-shared-code').logging;


var editServerURL = process.env.EDIT_SERVER_URL || "http://edit-server.localhost:5050/";
var sharedSecret = process.env.SHARED_SECRET || "a secret for inter-app communication";

exports.url = editServerURL;

// This checks the request body to see if it contains the shared secret, identifying the caller as the edit-server.
exports.requireEditServer = function (request, response, next) {
    var action = logging.action("dashboard.require_edit_server");
    if (request.body.secret !== sharedSecret) {
        action.error("not_authorized");
        response.json({status: "You are not an authorized admin app."});
    }
    else {
        action.finish();
        next();
    }
};

// TODO: this method of passing the secret directly is pretty rough.
exports.create = function (uuid, callback) {
    postToEditServer(
        editServerURL + 'worksheets/create/' + encodeURIComponent(uuid),
        callback,
        logging.action("dashboard.edit_server_create", {worksheetUUID: uuid})
    );
};

exports.authorize = function (token, uuid, callback) {
    postToEditServer(
        editServerURL + 'authorize/' + encodeURIComponent(uuid) + '/' + encodeURIComponent(token),
        callback,
        logging.action("dashboard.edit_server_authorize", {worksheetUUID: uuid, authToken: token})
    );
};

exports.delete = function (uuid, callback) {
    postToEditServer(
        editServerURL + 'worksheets/delete/' + encodeURIComponent(uuid),
        callback,
        logging.action("dashboard.edit_server_delete", {worksheetUUID: uuid})
    );
};

exports.thumbnail = function (uuid, callback) {
    var action = logging.action("dashboard.edit_server_thumbnail", {worksheetUUID: uuid});
    request(editServerURL + 'website/worksheets/thumbnail/' + encodeURIComponent(uuid),
        function (err, response, rawBody) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            var body = JSON.parse(rawBody);
            if (!body || !body.status) {
                action.error("no_response");
                return callback(new Error("No meaningful response from edit-server."));
            }
            if (body.status !== "ok") {
                action.error("bad_status", {status: body.status});
                return callback(new Error(body.status));
            }
            action.finish();
            callback(null, body.thumbnail);
        });
};

var postToEditServer = function (url, callback, action) {
    request.post({uri: url, json: {secret: sharedSecret}}, function (err, response, body) {
        if (!body || !body.status) {
            action.error("no_response");
            return callback(new Error("No meaningful response from edit-server."));
        }
        if (body.status !== "ok") {
            action.error("bad_status", {status: body.status});
            return callback(new Error(body.status));
        }
        if (err) return logging.handleErrorWithAction(err, action, callback);
        else {
            action.finish();
            callback();
        }
    });
};
