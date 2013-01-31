/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var website = require('./website');

/** API for website **/

exports.getWorksheet = function (request, response, next) {
    var worksheetID = request.params.id;
    website.loadWorksheet(worksheetID, function (err, worksheet) {
        if (err) return response.jsonp({status: err.message});
        response.jsonp({status: 'ok', worksheet: worksheet});
    });
};

exports.recentlyEditedWorksheetIDs = function (request, response, next) {
    website.recentlyEditedWorksheetIDs(function (err, ids) {
        if (err) return response.jsonp({status: err.message});
        response.jsonp({status: 'ok', ids: ids});
    });
};

