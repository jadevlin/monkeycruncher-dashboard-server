/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */
var db = require('monkeycruncher-shared-code').database("postgres://localhost:5432/monkeycruncher"),
    editServer = require('./edit-server-api'),
    logging = require('monkeycruncher-shared-code').logging;


exports.loadWorksheet = function (worksheetID, callback) {
    var action = logging.action("dashboard.website_load_worksheet", {worksheetID: worksheetID});
    db.connectAndQuery(
        "SELECT * FROM worksheets, users WHERE worksheets.id = $1 AND deleted = FALSE AND worksheets.owner = users.id",
        [worksheetID],
        function (err, result) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            if (result.rowCount !== 1) {
                action.error("worksheet_not_found");
                return callback(new Error("Worksheet not found."));
            }
            var ws = result.rows[0];
            var worksheet = mapWebsiteWorksheet(ws);
            // contact the edit-server for the document thumbnail
            editServer.thumbnail(worksheet.documentRef, function (err, thumbnail) {
                if (err) {
                    action.error("thumbnail_error");
                    return callback(err);
                }
                worksheet.thumbnail = thumbnail;
                action.finish();
                callback(null, worksheet);
            })
        })
};

var mapWebsiteWorksheet = function (ws) {
    var worksheet = {};
    worksheet.name = ws.name;
    worksheet.username = ws.username;
    worksheet.parent = ws.parent;
    worksheet.lastEdited = ws.last_edited;
    worksheet.documentRef = ws.document_ref;
    return worksheet;
};


exports.recentlyEditedWorksheetIDs = function (callback) {
    var action = logging.action("dashboard.website_recently_edited");
    db.connectAndQuery(
        "SELECT id FROM worksheets WHERE owner IS NOT NULL AND deleted = FALSE ORDER BY last_edited DESC LIMIT 21",
        [],
        function (err, result) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            var ids = [];
            result.rows.map(function (row) {
                ids.push(row.id)
            });
            action.finish();
            callback(null, ids);
        });
};