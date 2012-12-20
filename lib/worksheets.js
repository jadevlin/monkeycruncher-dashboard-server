var db = require('./database'),
    uuid = require('node-uuid'),
    editServer = require('./edit-server-api');

// To create a worksheet, we first contact the edit-server to create the document,
// then we enter the document into the dashboard's database.
exports.create = function (editServerURL, editServerSecret, name, user, callback) {
    var documentUUID = uuid.v4();
    editServer.create(editServerURL, editServerSecret, documentUUID, function (err) {
        if (err) return callback(err);
        exports.addWorksheetToDB(user.id, name, documentUUID, function (err, newID) {
            if (err) return callback(err);
            console.log("User " + user.username + " created worksheet: '" + name + "'");
            callback(null, newID);
        });
    });
};

exports.addWorksheetToDB = function (userID, worksheetName, uuid, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        client.query(
            "INSERT INTO worksheets (name, owner, document_ref) VALUES ($1, $2, $3)",
            [worksheetName, userID, uuid],
            function (err) {
                if (err) return callback(err);
                client.query(
                    "SELECT id FROM worksheets WHERE document_ref = $1",
                    [uuid],
                    function (err, result) {
                        if (err) return callback(err);
                        if (result.rowCount !== 1) return callback("Error selecting worksheet from database.");
                        callback(null, result.rows[0].id);
                    }
                )
            }
        );
    });
};

exports.delete = function (editServerURL, editServerSecret, worksheetID, documentUUID, callback) {
    console.log("Deleting worksheet ID " + worksheetID);
    editServer.delete(editServerURL, editServerSecret, documentUUID, function (err) {
        if (err) return callback(err);
        db.connect(function (err, client) {
            if (err) return callback(err);
            client.query(
                "DELETE FROM worksheets WHERE id = $1",
                [worksheetID],
                callback
            );
        });
    });
};

exports.isWorksheetOwner = function (userID, worksheetID, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        console.log("Checking ownership of worksheet " + worksheetID + " for user " + userID);
        client.query(
            "SELECT owner FROM worksheets WHERE id = $1",
            [worksheetID],
            function (err, result) {
                if (err) return callback(err);
                if (result.rowCount != 1) {
                    console.log("Incorrect number of rows.");
                    callback(new Error("No worksheet found."));
                } else {
                    var ownerID = result.rows[0].owner;
                    if (ownerID === userID) callback(null, true);
                    else callback(null, false);
                }
            }
        );
    });
};

exports.loadAllWorksheets = function (userID, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        console.log("Loading worksheets for user " + userID);
        client.query(
            "SELECT * FROM worksheets WHERE owner = $1",
            [userID],
            function (err, result) {
                if (err) return callback(err);
                // map the worksheet info and store it in the response locals
                var worksheets = [];
                result.rows.map(function (ws) {
                    var worksheet = {};
                    worksheet.id = ws.id;
                    worksheet.name = ws.name;
                    worksheet.owner = ws.owner;
                    worksheet.documentRef = ws.document_ref;
                    worksheets.push(worksheet);
                });
                callback(null, worksheets);
            }
        )
    })
};

exports.loadWorksheet = function (worksheetID, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        console.log("Loading worksheet: " + worksheetID);
        client.query(
            "SELECT * FROM worksheets WHERE id = $1",
            [worksheetID],
            function (err, result) {
                if (err) return callback(err);
                if (result.rowCount !== 1) return callback(new Error("Worksheet not found."));
                var ws = result.rows[0];
                var worksheet = {};
                worksheet.id = ws.id;
                worksheet.name = ws.name;
                worksheet.owner = ws.owner;
                worksheet.documentRef = ws.document_ref;
                callback(null, worksheet);
            }
        )
    })

};

