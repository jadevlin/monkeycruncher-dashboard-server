var db = require('./database'),
    uuid = require('node-uuid');

// To create a worksheet, we first contact the edit-server to create the document,
// then we enter the document into the dashboard's database.
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
            console.log("User " + user.username + " created worksheet: '" + name + "'");
            response.redirect('/dashboard.html');
        });
    }
};

var addWorksheetToDB = function (userID, worksheetName, uuid, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        client.query(
            "INSERT INTO worksheets (name, owner, document_ref) VALUES ($1, $2, $3)",
            [worksheetName, userID, uuid],
            callback
            );
    });
};

exports.edit = function (editServerURL) {
    return function (request, response) {

    }
};

exports.loadWorksheets = function (request, response, next) {
    db.connect(function (err, client) {
        if (err) return next(err);
        var ownerID = request.session.userID;
        client.query(
            "SELECT * FROM worksheets WHERE owner = $1",
            [ownerID],
            function (err, result) {
                if (err) return next(err);
                // map the worksheet info and store it in the response locals
                var worksheets = [];
                result.rows.map( function (ws) {
                    var worksheet = {};
                    worksheet.id = ws.id;
                    worksheet.name = ws.name;
                    worksheet.ownder = ws.owner;
                    worksheet.documentRef = ws.document_ref;
                    worksheets.push(worksheet);
                });
                response.locals.worksheets = worksheets;
                next();
            }
        )
    })

};

