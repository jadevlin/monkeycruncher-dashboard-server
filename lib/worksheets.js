/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var db = require('monkeycruncher-shared-code').database("postgres://localhost:5432/monkeycruncher"),
    uuid = require('node-uuid'),
    editServer = require('./edit-server-api'),
    logging = require('monkeycruncher-shared-code').logging;


// To create a worksheet, we first contact the edit-server to create the document,
// then we enter the document into the dashboard's database.
exports.create = function (name, user, callback) {
    var documentUUID = uuid.v4();
    var action = logging.action("dashboard.worksheet_create", {worksheetUUID: documentUUID, userID: user.id});
    editServer.create(documentUUID, function (err) {
        if (err) return logging.handleErrorWithAction(err, action, callback);
        exports.addWorksheetToDB(user.id, name, documentUUID, null, function (err, newID) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            action.finish();
            callback(null, newID);
        });
    });
};

exports.addWorksheetToDB = function (userID, worksheetName, uuid, parent, callback) {
    var action = logging.action("dashboard.worksheet_add",
        {worksheetUUID: uuid, worksheetName: worksheetName, parent: parent, userID: userID});
    db.connectAndQuery(
        "INSERT INTO worksheets " +
            "(name, owner, parent, last_edited, document_ref, deleted) VALUES ($1, $2, $3, NOW(), $4, FALSE)",
        [worksheetName, userID, parent, uuid],
        function (err) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            db.connectAndQuery(
                "SELECT id FROM worksheets WHERE document_ref = $1",
                [uuid],
                function (err, result) {
                    if (err) return logging.handleErrorWithAction(err, action, callback);
                    if (result.rowCount !== 1) {
                        action.error("unable_to_select");
                        return callback("Error selecting worksheet from database.");
                    }
                    var newID = result.rows[0].id;
                    action.finish({worksheetID: newID});
                    callback(null, newID);
                }
            )
        }
    );
};

exports.delete = function (worksheetID, documentUUID, callback) {
    var action = logging.action("dashboard.worksheet_delete", {worksheetID: worksheetID, worksheetUUID: documentUUID});
    editServer.delete(documentUUID, function (err) {
        if (err) return logging.handleErrorWithAction(err, action, callback);
        db.connectAndQuery(
            "UPDATE worksheets SET deleted = TRUE WHERE id = $1",
            [worksheetID],
            function (err) {
                if (err) return logging.handleErrorWithAction(err, action, callback);
                action.finish();
                callback();
            }
        );
    });
};

exports.rename = function (worksheetID, newName, callback) {
    var action = logging.action("dashboard.worksheet_rename", {worksheetID: worksheetID, newName: newName});
    db.connectAndQuery(
        "UPDATE worksheets SET name = $1 WHERE id = $2",
        [newName, worksheetID],
        function (err) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            action.finish();
            callback();
        }
    );
};

exports.isWorksheetOwner = function (userID, worksheetID, callback) {
    var action = logging.action("dashboard.worksheet_is_owner", {worksheetID: worksheetID, userID: userID});
    db.connectAndQuery(
        "SELECT owner FROM worksheets WHERE id = $1",
        [worksheetID],
        function (err, result) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            if (result.rowCount != 1) {
                action.error("incorrect_row_count");
                callback(new Error("No worksheet found."));
            } else {
                var ownerID = result.rows[0].owner;
                if (ownerID === userID) {
                    action.finish();
                    callback(null, true);
                }
                else {
                    action.warn("not_owner");
                    callback(null, false);
                }
            }
        }
    );
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
    var action = logging.action("dashboard.worksheet_load_all", {userID: userID});
    db.connectAndQuery(
        "SELECT * FROM worksheets WHERE owner = $1 AND deleted = FALSE ORDER BY last_edited DESC",
        [userID],
        function (err, result) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            var worksheets = [];
            result.rows.map(function (ws) {
                worksheets.push(mapWorksheet(ws))
            });
            action.finish();
            callback(null, worksheets);
        });
};

exports.loadWorksheet = function (worksheetID, callback) {
    var action = logging.action("dashboard.worksheet_load", {worksheetID: worksheetID});
    db.connectAndQuery(
        "SELECT * FROM worksheets WHERE id = $1 AND deleted = FALSE",
        [worksheetID],
        function (err, result) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            if (result.rowCount !== 1) {
                action.error("incorrect_row_count");
                return callback(new Error("Worksheet not found."));
            }
            var ws = result.rows[0];
            var worksheet = mapWorksheet(ws);
            action.finish();
            callback(null, worksheet);
        });
};

exports.loadWorksheetFromDocumentRef = function (documentRef, callback) {
    var action = logging.action("dashboard.worksheet_load_from_uuid", {worksheetUUID: documentRef});
    db.connectAndQuery(
        "SELECT * FROM worksheets WHERE document_ref = $1 AND deleted = FALSE",
        [documentRef],
        function (err, result) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            if (result.rowCount !== 1) {
                action.error("incorrect_row_count");
                return callback(new Error("Worksheet not found."));
            }
            action.finish();
            callback(null, mapWorksheet(result.rows[0]));
        });
};

exports.updateLastEditedDate = function (worksheetID, callback) {
    var action = logging.action("dashboard.worksheet_update_edit_date", {worksheetID: worksheetID});
    db.connectAndQuery(
        "UPDATE worksheets SET last_edited = NOW() WHERE id = $1 AND deleted = FALSE",
        [worksheetID],
        function (err, result) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            if (result.rowCount !== 1) {
                action.error("incorrect_row_count");
                return callback(new Error("Worksheet not found."));
            }
            action.finish();
            callback(null);
        });
};

exports.registerFork = function (oldUUID, newUUID, callback) {
    var action = logging.action('dashboard.worksheet_register_fork', {worksheetUUID: oldUUID, newUUID: newUUID});
    // first we get the worksheet ID of the old worksheet
    exports.loadWorksheetFromDocumentRef(oldUUID, function (err, parentWorksheet) {
        if (err) return logging.handleErrorWithAction(err, action, callback);
        // then we add the new worksheet, with the old worksheet as parent, and no owner.
        exports.addWorksheetToDB(null, 'Copy of ' + parentWorksheet.name, newUUID, parentWorksheet.id, function (err) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            action.finish();
            callback(err);
        });
    })
};

exports.claim = function (userID, uuid, callback) {
    var action = logging.action('dashboard.worksheet_claim', {worksheetUUID: uuid, userID: userID});
    db.connectAndQuery(
        "UPDATE worksheets SET owner = $1 WHERE document_ref = $2 AND owner IS NULL AND deleted = FALSE",
        [userID, uuid],
        function (err, result) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            if (result.rowCount !== 1) {
                action.error("not_claimable");
                return callback(new Error("Worksheet not claimable."));
            }
            action.finish();
            callback(null);
        });
};