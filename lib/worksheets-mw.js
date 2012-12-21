var worksheets = require('./worksheets'),
    editServer = require('./edit-server-api'),
    uuid = require('node-uuid');

// To create a worksheet, we first contact the edit-server to create the document,
// then we enter the document into the dashboard's database. We load the worksheet
// that has just been created and pass it back to the client.
exports.create = function (editServerURL, editServerSecret) {
    return function (request, response, next) {
        var name = request.params.name;
        var user = response.locals.user;
        worksheets.create(editServerURL, editServerSecret, name, user, function (err, newID) {
            if (err) return next(err);
            worksheets.loadWorksheet(newID, function (err, worksheet) {
                if (err) return next(err);
                response.json({worksheet: worksheet});
            })
        });
    }
};

exports.delete = function (editServerURL, editServerSecret) {
    return function (request, response, next) {
        var worksheetID = request.params.id;
        var documentUUID = response.locals.worksheet.documentRef;
        worksheets.delete(editServerURL, editServerSecret, worksheetID, documentUUID, function (err) {
            if (err) return next(err);
            response.json({status: 'ok'});
        });
    };
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

exports.authorizeEdit = function (editServerURL, editServerSecret) {
    return function (request, response, next) {
        // first we generate an authorization toke, send an authorization message to the edit-server,
        // and then return the token to the client.
        var token = uuid.v4();
        var documentUUID = response.locals.worksheet.documentRef;
        editServer.authorize(editServerURL, editServerSecret, token, documentUUID, function (err) {
            if (err) return next(err);
            response.json({status: 'ok', uuid: documentUUID, token: token});
        });
    }
};