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
            })
        }),

        // handler for the worksheet edit links
        editWorksheet: (function (data) {
            // We contact the dashboard and instruct it to tell the edit-server that we are authorized
            // to edit this worksheet. It returns the authorization token that we will use to authenticate
            // with the edit server.
            var win = window.open('');
            $.post('/worksheets/authorizeEdit/' + encodeURIComponent(data.id), function (response) {
                win.location.href = model.config.editServerURL + 'edit/' + encodeURIComponent(response.uuid) +
                    '/' + encodeURIComponent(response.token);
            });
        }),

        // handler for worksheet deletion.
        deleteWorksheet: (function (data) {
            bootbox.dialog(
                "<p>Are you sure you want to delete this worksheet?</p><p class='text-error'>" + data.name + "</p>",
                [
                    {
                        label: 'No'
                    },
                    {
                        label: 'Yes, delete',
                        class: 'btn-danger',
                        callback: (function (result) {
                            // contact the dashboard server to remove the worksheet and update the UI
                            $.post('/worksheets/delete/' + encodeURIComponent(data.id), function () {
                                $('#deleteWorksheetModal').modal('hide');
                                model.worksheets.remove(data);
                            });
                        })
                    }
                ],
                {header: "Are you sure?"});
        }),

        // handler for the worksheet create button
        createWorksheet: (function () {
            bootbox.prompt("Worksheet name", function(result) {
                if (result !== "" && result !== null) {
                    // contact the dashboard server to add the worksheet, and update the UI
                    $.post('/worksheets/create/' + encodeURIComponent(result), function (data) {
                        model.worksheets.push(data.worksheet);
                    }, 'json');
                }
            })
        })
    };


    // a helper function for authenticated requests. If any of them should return with an unauthorized status, then
    // the browser is redirected to the login page.
    var getAuthenticatedJSON = function (url, callback) {
        $.getJSON(url,function (data, statusText, jqXHR) {
            callback(data, statusText, jqXHR);
        }).fail(function (jqXHR) {
                if (jqXHR.status === 401) $('#loginModal').modal();
            }
        );
    };

    // Load configuration information from the server and start the application.
    $.getJSON('/config', function (data) {
        model.config = data;
        ko.applyBindings(model);
    });

    // contact the server and get the user information and worksheet list
    getAuthenticatedJSON('/userinfo', function (data) {
        model.user(data);
    });
    getAuthenticatedJSON('/worksheets', function (data) {
        model.worksheets(data);
    });


});