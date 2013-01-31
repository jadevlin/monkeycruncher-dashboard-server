/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */
var db = require('monkeycruncher-shared-code').database("postgres://localhost:5432/monkeycruncher"),
    editServer = require('./edit-server-api');

exports.loadWorksheet = function (worksheetID, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        console.log("Loading worksheet for website: " + worksheetID);
        client.query(
            "SELECT * FROM worksheets, users WHERE worksheets.id = $1 AND deleted = FALSE AND worksheets.owner = users.id",
            [worksheetID],
            function (err, result) {
                if (err) return callback(err);
                if (result.rowCount !== 1) return callback(new Error("Worksheet not found."));
                var ws = result.rows[0];
                var worksheet = mapWebsiteWorksheet(ws);
                // contact the edit-server for the document thumbnail
                console.log("Getting thumb for: " + worksheet.documentRef);
                editServer.thumbnail(worksheet.documentRef, function (err, thumbnail) {
                    if (err) return callback(err);
                    worksheet.thumbnail  = thumbnail;
                    callback(null, worksheet);
                })
            }
        )
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
    db.connect(function (err, client) {
        if (err) return callback(err);
        console.log("Getting recently edited worksheet IDs");
        client.query(
            "SELECT id FROM worksheets WHERE owner IS NOT NULL AND deleted = FALSE ORDER BY last_edited DESC LIMIT 10",
            [],
            function (err, result) {
                if (err) return callback(err);
                var ids = [];
                result.rows.map(function (row) { ids.push(row.id) });
                callback(null, ids);
            });
    });
}