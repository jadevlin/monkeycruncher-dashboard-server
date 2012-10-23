var db = require('./database'),
    uuid = require('node-uuid');

exports.create = function (editServerURL) {
    return function (request, response) {
        var name = request.body.name;
        var user = response.locals.user;
        var documentUUID = uuid.v4();
        addWorksheetToDB(user.id, name, documentUUID, function (err) {
            if (err) {
                console.log("Error creating worksheet");
                console.error(err);
                response.redirect('/dashboard.html');
            }
            console.log("User " + user.username + " created worksheet " + name);
            response.redirect('/dashboard.html');
        });
    }
};

var addWorksheetToDB = function (userID, worksheetName, uuid, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        client.query(
            "INSERT INTO worksheets (name, owner, documentRef) VALUES ($1, $2, $3)",
            [worksheetName, userID, uuid],
            callback
            );
    });
}