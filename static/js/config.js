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
        ko.applyBindings(model);
    });
});
