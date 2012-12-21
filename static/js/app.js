$(function () {

    var model = {

        config: {},

        user: ko.observable({
            username: undefined
        }),

        worksheets: ko.observableArray([]),

        logout: (function () {
            $.post('/logout', function () {
                window.location.href = '/login.html';
            })
        }),

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

        // TODO: these handlers for the dialogs are a bit messy. Think about separating stuff out better.
        deleteWorksheet: (function (data) {
            // attach the event handler here so we have the worksheet data in the closure
            $('#deleteWorksheetButton').click(function () {
                $.post('/worksheets/delete/' + encodeURIComponent(data.id), function () {
                    $('#deleteWorksheetModal').modal('hide');
                    model.worksheets.remove(data);
                })
            });
            $('#worksheetForDeletionName').text(data.name);
            $('#deleteWorksheetModal').modal();
        }),

        createWorksheet: (function () {
            $('#createWorksheetModal').modal();
            $('#inputWorksheetName').focus();
        }),
        createWorksheetConfirm: (function (model) {
            var name = $('#inputWorksheetName').val();
            $.post('/worksheets/create/' + encodeURIComponent(name), function (data) {
                $('#createWorksheetModal').modal('hide');
                model.worksheets.push(data.worksheet);
            }, 'json');
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
    $.getJSON('/config', function(data) {
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