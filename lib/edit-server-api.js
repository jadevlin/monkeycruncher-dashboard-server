/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var request = require('request');

// TODO: this method of passing the secret directly is pretty rough.
exports.create = function (editServerURL, secret, uuid, callback) {
    postToEditServer(
        editServerURL + 'worksheets/create/' + encodeURIComponent(uuid),
        secret,
        callback
    );
};

exports.authorize = function (editServerURL,  secret, token, uuid, callback) {
    postToEditServer(
        editServerURL + 'authorize/' + encodeURIComponent(uuid) + '/' + encodeURIComponent(token),
        secret,
        callback
    );
};

exports.delete = function (editServerURL,  secret, uuid, callback) {
    postToEditServer(
        editServerURL + 'worksheets/delete/' + encodeURIComponent(uuid),
        secret,
        callback

    )
};

var postToEditServer = function (url, secret, callback) {
    request.post({uri: url, json: {secret: secret}}, function (err, response, body) {
        if (!body.status || body.status !== "ok") return callback(body.status);
        if (err) return callback(err);
        else callback();
    });
};
