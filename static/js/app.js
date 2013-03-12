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

        editWorksheet: (function (data) {
            model.handleEdit(data, 'edit')
        }),

        recoveryEditWorksheet: (function (data) {
            model.handleEdit(data, 'recovery')
        }),

        handleEdit: (function (data, mode) {
            // We contact the dashboard and instruct it to tell the edit-server that we are authorized
            // to edit this worksheet. It returns the authorization token that we will use to authenticate
            // with the edit server.
            var win = window.open('');
            postAuthenticated('/worksheets/authorizeEdit/' + encodeURIComponent(data.id),
                function (response) {
                    win.location.href = model.config.editServerURL + mode + '/' + encodeURIComponent(response.uuid) +
                        '/' + encodeURIComponent(response.token);
                    // we want to move the current worksheet to the top of the list, and update its last_edited.
                    // This won't quite be in sync with the server, but it doesn't really matter.
                    model.worksheets.remove(data);
                    model.worksheets.unshift(data);
                    // this won't be an ISO 8601 date, like those from the server, but we'll get away with it.
                    data.lastEdited(Date());
                },
                function () {
                    bootbox.alert("There was a server problem while authorizing the edit.");
                });
        }),

        renameWorksheet: (function (data) {
            bootbox.prompt("New worksheet name", "Cancel", "Rename",
                function (result) {
                    if (result !== "" && result !== null) {
                        // contact the dashboard server to rename the worksheet, and update the UI
                        postAuthenticated(
                            '/worksheets/rename/' + encodeURIComponent(data.id) + '/' + encodeURIComponent(result),
                            function () {
                                data.name(result);
                            },
                            function () {
                                bootbox.alert("There was a server problem executing the rename request.");
                            }
                        );
                    }
                }, data.name())
        }),

        // handler for worksheet deletion.
        removeWorksheet: (function (data) {
            bootbox.dialog(
                "<p>Are you sure you want to delete this worksheet?</p>" +
                    "<p class='text-error'>" + data.name() + "</p>",
                [
                    {
                        label: 'No'
                    },
                    {
                        label: 'Yes, delete',
                        class: 'btn-danger',
                        callback: (function () {
                            // contact the dashboard server to remove the worksheet and update the UI
                            postAuthenticated('/worksheets/delete/' + encodeURIComponent(data.id),
                                function () {
                                    model.worksheets.remove(data);
                                },
                                function () {
                                    bootbox.alert("There was a server problem while deleting the worksheet.");
                                });
                        })
                    }
                ],
                {header: "Are you sure?"});
        }),

        // handler for the worksheet create button
        createWorksheet: (function () {
            bootbox.prompt("Worksheet name",
                function (result) {
                    if (result !== "" && result !== null) {
                        // contact the dashboard server to add the worksheet, and update the UI
                        postAuthenticated('/worksheets/create/' + encodeURIComponent(result),
                            function (data) {
                                model.worksheets.unshift(makeWorksheetModel(data.worksheet));
                            },
                            function () {
                                bootbox.alert("There was a server problem while creating the worksheet.");
                            });
                    }
                })
        }),

        // handler for worksheet claiming
        claimWorksheet: (function () {
            bootbox.prompt("Worksheet password",
                function (result) {
                    if (result !== "" && result !== null) {
                        postAuthenticated('/worksheets/claim/' + encodeURIComponent(result),
                            function (data) {
                                if (data.status === 'ok') model.worksheets.unshift(makeWorksheetModel(data.worksheet));
                                else bootbox.alert("It was not possible to claim the worksheet. Please check" +
                                    " that the password is correct. Note that unclaimed worksheets are deleted" +
                                    " after a few days.");
                            },
                            function () {
                                bootbox.alert("There was a server problem while claiming the worksheet.");
                            })
                    }
                });
        })
    };


    // a helper function for authenticated JSON GETs. If any of them should return with an unauthorized status, then
    // the browser is redirected to the login page. This call will append the anti-CSRF token from the model's config
    // as a query parameter.
    var getAuthenticatedJSON = function (url, callback, failCallback) {
        $.getJSON(url + '?_csrf=' + model.config._csrf,
            function (data, statusText, jqXHR) {
                callback(data, statusText, jqXHR);
            }
        ).fail(function (jqXHR) {
                if (jqXHR.status === 401) $('#loginModal').modal();
                else failCallback();
            }
        );
    };
    // a similar helper for authenticated POSTs.
    var postAuthenticated = function (url, callback, failCallback) {
        return $.post(url + '?_csrf=' + model.config._csrf,
            function (data, statusText, jqXHR) {
                callback(data, statusText, jqXHR);
            }, 'json'
        ).fail(function (jqXHR) {
                if (jqXHR.status === 401) $('#loginModal').modal();
                else failCallback();
            }
        );
    };

    // helper function for extracting URL query parameters
    var getQueryParameterByName = function (name) {
        var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    };

    // takes a JSON worksheet from the server and turns it into an observable KO model
    var makeWorksheetModel = function (wsJSON) {
        var wsModel = {};
        wsModel.id = wsJSON.id;
        wsModel.name = ko.observable(wsJSON.name);
        wsModel.owner = wsJSON.owner;
        wsModel.parent = wsJSON.parent;
        wsModel.lastEdited = ko.observable(wsJSON.lastEdited);
        wsModel.documentRef = wsJSON.documentRef;
        // it's convenient to construct this here, rather than in the markup
        wsModel.viewLink = model.config.editServerURL + 'view/' + wsModel.documentRef;
        return wsModel;
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
            model.worksheets(data.map(makeWorksheetModel));
        });

        ko.applyBindings(model);
    });

    // for easier debugging
    window.mcDashboardModel = model;

});