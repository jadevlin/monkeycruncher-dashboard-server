/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var worksheets = require('./worksheets'),
    editServer = require('./edit-server-api'),
    uuid = require('node-uuid');

// To create a worksheet, we first contact the edit-server to create the document,
// then we enter the document into the dashboard's database. We load the worksheet
// that has just been created and pass it back to the client.
exports.create = function (request, response, next) {
    var name = request.params.name;
    var user = response.locals.user;
    worksheets.create(name, user, function (err, newID) {
        if (err) return next(err);
        worksheets.loadWorksheet(newID, function (err, worksheet) {
            if (err) return next(err);
            response.json({worksheet: worksheet});
        })
    });
};

exports.delete = function (request, response, next) {
    var worksheetID = request.params.id;
    var documentUUID = response.locals.worksheet.documentRef;
    worksheets.delete(worksheetID, documentUUID, function (err) {
        if (err) return next(err);
        response.json({status: 'ok'});
    });
};

exports.rename = function (request, response, next) {
    var worksheetID = request.params.id;
    var newName = request.params.newName;
    worksheets.rename(worksheetID, newName, function (err) {
        if (err) return next(err);
        response.json({status: 'ok'});
    });
};

exports.mustBeWorksheetOwner = function (request, response, next) {
    var worksheetID = request.params.id;
    var userID = request.session.userID;
    worksheets.isWorksheetOwner(userID, worksheetID, function (err, result) {
        if (err) return next(err);
        if (result) return next();
        else return next(new Error("You are not the worksheet owner."));
    });
};

exports.loadAllWorksheets = function (request, response, next) {
    var ownerID = request.session.userID;
    worksheets.loadAllWorksheets(ownerID, function (err, worksheets) {
        if (err) return next(err);
        response.locals.worksheets = worksheets;
        next();
    })
};

exports.loadWorksheet = function (request, response, next) {
    var worksheetID = request.params.id;
    worksheets.loadWorksheet(worksheetID, function (err, worksheet) {
        if (err) next(err);
        response.locals.worksheet = worksheet;
        next();
    });
};

exports.authorizeEdit = function (request, response, next) {
    // we generate an authorization token, send an authorization message to the edit-server,
    // and then return the token to the client.
    var token = uuid.v4();
    var documentUUID = response.locals.worksheet.documentRef;
    editServer.authorize(token, documentUUID, function (err) {
        if (err) return next(err);
        worksheets.updateLastEditedDate(response.locals.worksheet.id, function (err) {
            if (err) return next(err);
            response.json({status: 'ok', uuid: documentUUID, token: token});
        });
    });
};

exports.registerFork = function (request, response, next) {
    var oldUUID = request.params.oldUUID;
    var newUUID = request.params.newUUID;
    worksheets.registerFork(oldUUID, newUUID, function (err) {
        if (err) return next(err);
        response.json({status: 'ok'});
    });
};

exports.claim = function (request, response, next) {
    var userID = response.locals.user.id;
    var worksheetUUID = request.params.uuid;
    worksheets.claim(userID, worksheetUUID, function (err) {
        if (err) response.json({status: err.message});
        worksheets.loadWorksheetFromDocumentRef(worksheetUUID, function (err, worksheet) {
            if (err) response.json({status: err.message});
            response.json({status: 'ok', worksheet: worksheet});
        });
    });
};

/* API for website */

exports.recentlyEditedWorksheets = function (request, response, next) {
    worksheets.recentlyEditedWorksheets(function (err, worksheets) {
        if (err) response.json({status: err.message});
        response.json({status: 'ok', worksheets: worksheets});
    });
}