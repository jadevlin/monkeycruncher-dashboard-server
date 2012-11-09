var worksheets = require('./worksheets'),
    editServer = require('./edit-server-api'),
    uuid = require('node-uuid');

// To create a worksheet, we first contact the edit-server to create the document,
// then we enter the document into the dashboard's database.
exports.create = function (editServerURL, editServerSecret) {
    return function (request, response, next) {
        var name = request.body.name;
        var user = response.locals.user;
        worksheets.create(editServerURL, editServerSecret, name, user, next);
    }
};

//TODO: this doesn't seem to belong in either here or worksheets!
exports.edit = function (editServerURL, editServerSecret, editMode) {
    return function (request, response, next) {
        // first we send an authorization message to the edit-server, then we redirect
        // to the edit-server's editor URL.
        // generate an authorization token
        var token = uuid.v4();
        var documentUUID = response.locals.worksheet.documentRef;
        editServer.authorize(editServerURL, editServerSecret, token, documentUUID, function (err) {
            if (err) return next(err);
            response.redirect(
                editServerURL + editMode + '/' + encodeURIComponent(documentUUID) + '/' + encodeURIComponent(token)
            );
        });
    }
};

exports.delete = function (editServerURL, editServerSecret) {
    return function (request, response, next) {
        var worksheetID = request.body.worksheetID;
        var documentUUID = response.locals.worksheet.documentRef;
        worksheets.delete(editServerURL, editServerSecret, worksheetID, documentUUID, next);
    };
};

exports.mustBeWorksheetOwner = function (request, response, next) {
    var worksheetID = request.body.worksheetID;
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
    var worksheetID = request.body.worksheetID;
    worksheets.loadWorksheet(worksheetID, function (err, worksheet) {
        if (err) next(err);
        response.locals.worksheet = worksheet;
        next();
    });
};

