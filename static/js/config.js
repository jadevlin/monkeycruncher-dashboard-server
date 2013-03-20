/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

$(function () {

    var model = {
        // this will be loaded from the server on app start-up
        config: {}
    };

    // Load configuration information from the server and start the application.
    $.getJSON('/config', function (data) {
        model.config = data;

        if (model.config.gaPropertyID) initialiseGA(model.config.gaPropertyID);
        if (model.config.mixpanelToken) initialiseMP(model.config.mixpanelToken);
        $(function () {ko.applyBindings(model)});

        if (configLoadedCallback) configLoadedCallback();
    });
});
