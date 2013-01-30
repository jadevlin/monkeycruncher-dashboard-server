/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */
var db = require('monkeycruncher-shared-code').database("postgres://localhost:5432/monkeycruncher");

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
                callback(null, worksheet);
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


exports.recentlyEditedWorksheets = function (callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        console.log("Getting recently edited worksheets");
        client.query(
            "SELECT * FROM worksheets, users WHERE owner IS NOT NULL" +
                " AND deleted = FALSE AND worksheets.owner = users.id ORDER BY last_edited DESC LIMIT 10",
            [],
            function (err, result) {
                if (err) return callback(err);
                var worksheets = [];
                result.rows.map(function (ws) {
                    worksheets.push(mapWebsiteWorksheet(ws))
                });
                callback(null, worksheets);
            });
    });
}