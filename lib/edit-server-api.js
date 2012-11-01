var request = require('request');

exports.create = function (editServerURL, uuid, callback) {
    request.post(editServerURL + 'worksheets/create/' + encodeURIComponent(uuid), function (err, response) {
        if (err) return callback(err);
        else callback();
    });
};


