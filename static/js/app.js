/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

$(function () {

    // the viewmodel for the page, has config info, user info, and the list of worksheets.
    var model = {

        // this will be loaded from the server on app start-up
        config: {},

        // the logged in user's details
        user: ko.observable({
            username: undefined
        }),

        // the list of worksheets on the user's account
        worksheets: ko.observableArray([]),

        // handler for the logout button
        logout: (function () {
            $.post('/logout', function () {
                window.location.href = '/login.html';
            });
        }),

        // handler for the worksheet edit links
        editWorksheet: (function (data) {
            // We contact the dashboard and instruct it to tell the edit-server that we are authorized
            // to edit this worksheet. It returns the authorization token that we will use to authenticate
            // with the edit server.
            var win = window.open('');
            postAuthenticated('/worksheets/authorizeEdit/' + encodeURIComponent(data.id), function (response) {
                win.location.href = model.config.editServerURL + 'edit/' + encodeURIComponent(response.uuid) +
                    '/' + encodeURIComponent(response.token);
            });
        }),

        forkWorksheet: (function (data) {

        }),

        // handler for worksheet deletion.
        removeWorksheet: (function (data) {
            bootbox.dialog(
                "<p>Are you sure you want to delete this worksheet?</p>" +
                    "<p class='text-error'>" + data.name + "</p>",
                [
                    {
                        label: 'No'
                    },
                    {
                        label: 'Yes, delete',
                        class: 'btn-danger',
                        callback: (function () {
                            // contact the dashboard server to remove the worksheet and update the UI
                            postAuthenticated('/worksheets/delete/' + encodeURIComponent(data.id), function () {
                                model.worksheets.remove(data);
                            });
                        })
                    }
                ],
                {header: "Are you sure?"});
        }),

        // handler for the worksheet create button
        createWorksheet: (function () {
            bootbox.prompt("Worksheet name", function (result) {
                if (result !== "" && result !== null) {
                    // contact the dashboard server to add the worksheet, and update the UI
                    postAuthenticated('/worksheets/create/' + encodeURIComponent(result), function (data) {
                        model.worksheets.push(data.worksheet);
                    });
                }
            })
        }),

        // handler for worksheet claiming
        claimWorksheet: (function () {
            bootbox.prompt("Worksheet password", function (result) {
                if (result !=="" && result !== null) {
                    postAuthenticated('/worksheets/claim/' + encodeURIComponent(result), function (data) {
                        if (data.status === 'ok') model.worksheets.push(data.worksheet);
                        else bootbox.alert("It was not possible to claim the worksheet. Please check that the " +
                            "password is correct. Note that unclaimed worksheets are deleted after a few days.");
                    })
                }
            })
        })
    };


    // a helper function for authenticated JSON GETs. If any of them should return with an unauthorized status, then
    // the browser is redirected to the login page. This call will append the anti-CSRF token from the model's config
    // as a query parameter.
    var getAuthenticatedJSON = function (url, callback) {
        $.getJSON(url + '?_csrf=' + model.config._csrf, function (data, statusText, jqXHR) {
            callback(data, statusText, jqXHR);
        }).fail(function (jqXHR) {
                if (jqXHR.status === 401) $('#loginModal').modal();
            }
        );
    };
    // a similar helper for authenticated POSTs.
    var postAuthenticated = function (url, callback) {
        $.post(url + '?_csrf=' + model.config._csrf, function (data, statusText, jqXHR) {
            callback(data, statusText, jqXHR);
        }, 'json').fail(function (jqXHR) {
                if (jqXHR.status === 401) $('#loginModal').modal();
            }
        );
    };

    // helper function for extracting URL query parameters
    var getQueryParameterByName = function (name) {
        var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    };


    // Load configuration information from the server and start the application.
    $.getJSON('/config', function (data) {
        model.config = data;
        // The login page should have passed us the anti-CSRF token as a query parameter. We store it in the
        // config, as we will need it to make any authenticated API calls.
        model.config._csrf = getQueryParameterByName('_csrf');

        // contact the server and get the user information and worksheet list
        getAuthenticatedJSON('/userinfo', function (data) {
            model.user(data);
        });
        getAuthenticatedJSON('/worksheets', function (data) {
            model.worksheets(data);
        });

        ko.applyBindings(model);
    });

    // for easier debugging
    window.mcDashboardModel = model;

});