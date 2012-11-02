var request = require('request');

exports.create = function (editServerURL, editServerSecret, uuid, callback) {
    postToEditServer(
        editServerURL + 'worksheets/create/' + encodeURIComponent(uuid),
        editServerSecret,
        callback
    );
};

exports.authorize = function (editServerURL,  editServerSecret, token, uuid, callback) {
    postToEditServer(
        editServerURL + 'authorize/' + encodeURIComponent(uuid) + '/' + encodeURIComponent(token),
        editServerSecret,
        callback
    );
};

var postToEditServer = function (url, secret, callback) {
    request.post({uri: url, json: {secret: secret}}, function (err, response, body) {
        if (!body.status || body.status !== "ok") return callback(body.status);
        if (err) return callback(err);
        else callback();
    });
}
