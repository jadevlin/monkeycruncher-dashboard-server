/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var db = require('monkeycruncher-shared-code').database("postgres://localhost:5432/monkeycruncher"),
    uuid = require('node-uuid'),
    editServer = require('./edit-server-api');

// To create a worksheet, we first contact the edit-server to create the document,
// then we enter the document into the dashboard's database.
exports.create = function (name, user, callback) {
    var documentUUID = uuid.v4();
    editServer.create(documentUUID, function (err) {
        if (err) return callback(err);
        exports.addWorksheetToDB(user.id, name, documentUUID, null, function (err, newID) {
            if (err) return callback(err);
            console.log("User " + user.username + " created worksheet: '" + name + "'");
            callback(null, newID);
        });
    });
};

exports.addWorksheetToDB = function (userID, worksheetName, uuid, parent, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        client.query(
            "INSERT INTO worksheets " +
                "(name, owner, parent, last_edited, document_ref, deleted) VALUES ($1, $2, $3, NOW(), $4, FALSE)",
            [worksheetName, userID, parent, uuid],
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

exports.delete = function (worksheetID, documentUUID, callback) {
    console.log("Deleting worksheet ID " + worksheetID);
    editServer.delete(documentUUID, function (err) {
        if (err) return callback(err);
        db.connect(function (err, client) {
            if (err) return callback(err);
            client.query(
                "UPDATE worksheets SET deleted = TRUE WHERE id = $1",
                [worksheetID],
                callback
            );
        });
    });
};

exports.rename = function (worksheetID, newName, callback) {
    console.log("Renaming worksheet ID " + worksheetID);
    db.connect(function (err, client) {
        if (err) return callback(err);
        client.query(
            "UPDATE worksheets SET name = $1 WHERE id = $2",
            [newName, worksheetID],
            callback
        );
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

var mapWorksheet = function (ws) {
    var worksheet = {};
    worksheet.id = ws.id;
    worksheet.name = ws.name;
    worksheet.owner = ws.owner;
    worksheet.parent = ws.parent;
    worksheet.lastEdited = ws.last_edited;
    worksheet.documentRef = ws.document_ref;
    worksheet.deleted = ws.deleted;
    return worksheet;
};

exports.loadAllWorksheets = function (userID, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        console.log("Loading worksheets for user " + userID);
        client.query(
            "SELECT * FROM worksheets WHERE owner = $1 AND deleted = FALSE ORDER BY last_edited DESC",
            [userID],
            function (err, result) {
                if (err) return callback(err);
                // map the worksheet info and store it in the response locals
                var worksheets = [];
                result.rows.map(function (ws) {
                    worksheets.push(mapWorksheet(ws))
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
            "SELECT * FROM worksheets WHERE id = $1 AND deleted = FALSE",
            [worksheetID],
            function (err, result) {
                if (err) return callback(err);
                if (result.rowCount !== 1) return callback(new Error("Worksheet not found."));
                var ws = result.rows[0];
                var worksheet = mapWorksheet(ws);
                callback(null, worksheet);
            }
        )
    })
};

exports.loadWorksheetFromDocumentRef = function (documentRef, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        console.log("Finding worksheet UUID: " + documentRef);
        client.query(
            "SELECT * FROM worksheets WHERE document_ref = $1 AND deleted = FALSE",
            [documentRef],
            function (err, result) {
                if (err) return callback(err);
                if (result.rowCount !== 1) return callback(new Error("Worksheet not found."));
                callback(null, mapWorksheet(result.rows[0]));
            }
        )
    })
};

exports.updateLastEditedDate = function (worksheetID, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        console.log("Modifying edit date on worksheet UUID: " + worksheetID);
        client.query(
            "UPDATE worksheets SET last_edited = NOW() WHERE id = $1 AND deleted = FALSE",
            [worksheetID],
            function (err, result) {
                if (err) return callback(err);
                if (result.rowCount !== 1) return callback(new Error("Worksheet not found."));
                callback(null);
            }
        )
    })
};

exports.registerFork = function (oldUUID, newUUID, callback) {
    // first we get the worksheet ID of the old worksheet
    exports.loadWorksheetFromDocumentRef(oldUUID, function (err, parentWorksheet) {
        if (err) return callback(err);
        // then we add the new worksheet, with the old worksheet as parent, and no owner.
        exports.addWorksheetToDB(null, 'Copy of ' + parentWorksheet.name, newUUID, parentWorksheet.id, callback);
    })
};

exports.claim = function (userID, uuid, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        console.log("Claiming worksheet UUID: " + uuid + " for user: " + userID);
        client.query(
            "UPDATE worksheets SET owner = $1 WHERE document_ref = $2 AND owner IS NULL AND deleted = FALSE",
            [userID, uuid],
            function (err, result) {
                if (err) return callback(err);
                if (result.rowCount !== 1) return callback(new Error("Worksheet not claimable."));
                callback(null);
            }
        )
    })
};