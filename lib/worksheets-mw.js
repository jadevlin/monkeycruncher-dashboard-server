/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var worksheets = require('./worksheets'),
    editServer = require('./edit-server-api'),
    uuid = require('node-uuid'),
    logging = require('monkeycruncher-shared-code').logging;


// To create a worksheet, we first contact the edit-server to create the document,
// then we enter the document into the dashboard's database. We load the worksheet
// that has just been created and pass it back to the client.
exports.create = function (request, response, next) {
    var name = request.params.name;
    var user = response.locals.user;
    var action = logging.action("dashboard.worksheet_create_mw", {userID: user.id, worksheetName: '"' + name + '"'});
    worksheets.create(name, user, function (err, newID) {
        if (err) return logging.handleErrorWithAction(err, action, next);
        worksheets.loadWorksheet(newID, function (err, worksheet) {
            if (err) return logging.handleErrorWithAction(err, action, next);
            action.finish();
            response.json({worksheet: worksheet});
        })
    });
};

exports.delete = function (request, response, next) {
    var worksheetID = request.params.id;
    var documentUUID = response.locals.worksheet.documentRef;
    var action = logging.action("dashboard.worksheet_delete_mw", {worksheetID: worksheetID, worksheetUUID: documentUUID});
    worksheets.delete(worksheetID, documentUUID, function (err) {
        if (err) return logging.handleErrorWithAction(err, action, next);
        action.finish();
        response.json({status: 'ok'});
    });
};

exports.rename = function (request, response, next) {
    var worksheetID = request.params.id;
    var newName = request.params.newName;
    var action = logging.action("dashboard.worksheet_rename_mw", {worksheetID: worksheetID, newName: newName});
    worksheets.rename(worksheetID, newName, function (err) {
        if (err) return logging.handleErrorWithAction(err, action, next);
        action.finish();
        response.json({status: 'ok'});
    });
};

exports.mustBeWorksheetOwner = function (request, response, next) {
    var worksheetID = request.params.id;
    var userID = request.session.userID;
    var action = logging.action("dashboard.worksheet_owner_mw", {worksheetID: worksheetID, userID: userID});
    worksheets.isWorksheetOwner(userID, worksheetID, function (err, result) {
        if (err) return logging.handleErrorWithAction(err, action, next);
        if (result) {
            action.finish();
            return next();
        }
        else {
            action.warn("not_owner");
            return next(new Error("You are not the worksheet owner."));
        }
    });
};

exports.loadAllWorksheets = function (request, response, next) {
    var ownerID = request.session.userID;
    var action = logging.action("dashboard.worksheet_load_all_mw", {ownerID: ownerID});
    worksheets.loadAllWorksheets(ownerID, function (err, worksheets) {
        if (err) return logging.handleErrorWithAction(err, action, next);
        response.locals.worksheets = worksheets;
        action.finish();
        next();
    })
};

exports.loadWorksheet = function (request, response, next) {
    var worksheetID = request.params.id;
    var action = logging.action("dashboard.worksheet_load_mw", {worksheetID: worksheetID});
    worksheets.loadWorksheet(worksheetID, function (err, worksheet) {
        if (err) return logging.handleErrorWithAction(err, action, next);
        response.locals.worksheet = worksheet;
        action.finish();
        next();
    });
};

exports.authorizeEdit = function (request, response, next) {
    // we generate an authorization token, send an authorization message to the edit-server,
    // and then return the token to the client.
    var token = uuid.v4();
    var documentUUID = response.locals.worksheet.documentRef;
    var action = logging.action("dashboard.worksheet_authorize_edit_mw", {worksheetUUID: documentUUID, authToken: token});
    editServer.authorize(token, documentUUID, function (err) {
        if (err) return logging.handleErrorWithAction(err, action, callback);
        worksheets.updateLastEditedDate(response.locals.worksheet.id, function (err) {
            if (err) return logging.handleErrorWithAction(err, action, next);
            response.json({status: 'ok', uuid: documentUUID, token: token});
        });
    });
};

exports.registerFork = function (request, response, next) {
    var oldUUID = request.params.oldUUID;
    var newUUID = request.params.newUUID;
    var action = logging.action("dashboard.worksheet_register_fork_mw", {worksheetUUID: oldUUID, newUUID: newUUID});
    worksheets.registerFork(oldUUID, newUUID, function (err) {
        if (err) return logging.handleErrorWithAction(err, action, next);
        response.json({status: 'ok'});
    });
};

exports.claim = function (request, response, next) {
    var userID = response.locals.user.id;
    var worksheetUUID = request.params.uuid;
    var action = logging.action("dashboard.worksheet_claim_mw", {userID: userID, worksheetUUID: worksheetUUID});
    worksheets.claim(userID, worksheetUUID, function (err) {
        if (err) {
            action.error(err.message);
            response.json({status: err.message});
        }
        worksheets.loadWorksheetFromDocumentRef(worksheetUUID, function (err, worksheet) {
            if (err) {
                action.error(err.message);
                response.json({status: err.message});
            }
            response.json({status: 'ok', worksheet: worksheet});
        });
    });
};
