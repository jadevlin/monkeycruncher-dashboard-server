/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var website = require('./website'),
    logging = require('monkeycruncher-shared-code').logging;

/** API for website **/

exports.getWorksheet = function (request, response, next) {
    var worksheetID = request.params.id;
    var action = logging.action('dashboard.website_get_mw', {worksheetID: worksheetID});
    website.loadWorksheet(worksheetID, function (err, worksheet) {
        if (err) {
            action.error(err.message);
            return response.jsonp({status: err.message});
        }
        action.finish();
        response.jsonp({status: 'ok', worksheet: worksheet});
    });
};

exports.recentlyEditedWorksheetIDs = function (request, response, next) {
    var action = logging.action('dashboard.website_recently_edited_mw');
    website.recentlyEditedWorksheetIDs(function (err, ids) {
        if (err) {
            action.error(err.message);
            return response.jsonp({status: err.message});
        }
        action.finish();
        response.jsonp({status: 'ok', ids: ids});
    });
};

