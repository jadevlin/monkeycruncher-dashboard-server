var db = require('./database'),
    uuid = require('node-uuid'),
    editServer = require('./edit-server-api');

// To create a worksheet, we first contact the edit-server to create the document,
// then we enter the document into the dashboard's database.
exports.create = function (editServerURL, editServerSecret) {
    return function (request, response, next) {
        var name = request.body.name;
        var user = response.locals.user;
        var documentUUID = uuid.v4();
        editServer.create(editServerURL, editServerSecret, documentUUID, function (err) {
            if (err) return next(err);
            addWorksheetToDB(user.id, name, documentUUID, function (err) {
                if (err) return next(err);
                console.log("User " + user.username + " created worksheet: '" + name + "'");
                next();
            });
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

exports.edit = function (editServerURL, editServerSecret) {
    return function (request, response, next) {
        // first we send an authorization message to the edit-server, then we redirect
        // to the edit-server's editor URL.
        // generate an authorization token
        var token = uuid.v4();
        var documentUUID = response.locals.worksheet.documentRef;
        editServer.authorize(editServerURL, editServerSecret, token, documentUUID, function (err) {
            if (err) return next(err);
            response.redirect(
                editServerURL + 'edit/' + encodeURIComponent(documentUUID) + '/' + encodeURIComponent(token)
            );
        });
    }

};

exports.delete = function (editServerURL, editServerSecret) {
    return function (request, response, next) {
        var worksheetID = request.body.worksheetID;
        var documentUUID = response.locals.worksheet.documentRef;
        console.log("Deleting worksheet ID " + worksheetID);
        editServer.delete(editServerURL, editServerSecret, documentUUID, function (err) {
            if (err) return next(err);
            db.connect(function (err, client) {
                if (err) return next(err);
                client.query(
                    "DELETE FROM worksheets WHERE id = $1",
                    [worksheetID],
                    next
                );
            });
        });
    }
};

exports.mustBeWorksheetOwner = function (request, response, next) {
    db.connect(function (err, client) {
        if (err) return next(err);
        console.log("Checking ownership of worksheet " + request.body.worksheetID + " for user " + request.session.userID);
        client.query(
            "SELECT owner FROM worksheets WHERE id = $1",
            [request.body.worksheetID],
            function (err, result) {
                if (err) return next(err);
                if (result.rowCount != 1) {
                    console.log("Incorrect number of rows.");
                    next(new Error("No worksheet found."));
                } else {
                    var ownerID = result.rows[0].owner;
                    if (ownerID === request.session.userID) next();
                    else next(new Error("You are not the worksheet owner."));
                }
            }
        );
    });
};

exports.loadAllWorksheets = function (request, response, next) {
    db.connect(function (err, client) {
        if (err) return next(err);
        var ownerID = request.session.userID;
        console.log("Loading worksheets for user " + ownerID);
        client.query(
            "SELECT * FROM worksheets WHERE owner = $1",
            [ownerID],
            function (err, result) {
                if (err) return next(err);
                // map the worksheet info and store it in the response locals
                var worksheets = [];
                result.rows.map(function (ws) {
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

exports.loadWorksheet = function (request, response, next) {
    db.connect(function (err, client) {
        if (err) return next(err);
        var worksheetID = request.body.worksheetID;
        console.log("Loading worksheet: " + worksheetID);
        client.query(
            "SELECT * FROM worksheets WHERE id = $1",
            [worksheetID],
            function (err, result) {
                if (err) return next(err);
                if (result.rowCount !== 1) return next(new Error("Worksheet not found."));
                var ws = result.rows[0];
                var worksheet = {};
                worksheet.id = ws.id;
                worksheet.name = ws.name;
                worksheet.ownder = ws.owner;
                worksheet.documentRef = ws.document_ref;
                response.locals.worksheet = worksheet;
                next();
            }
        )
    })

};

