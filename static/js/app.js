$(function () {

    var model = {

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

        }),

        deleteWorksheet: (function (data) {
            console.log(data);
        }),

        createWorksheet: (function (data) {

        })


    };

    // a helper function for authenticated requests. If any of them should return with an unauthorized status, then
    // the browser is redirected to the login page.
    var getAuthenticatedJSON = function (url, callback) {
        $.getJSON(url,function (data, statusText, jqXHR) {
            callback(data, statusText, jqXHR);
        }).fail(function (jqXHR) {
                if (jqXHR.status === 401) window.location.href = '/login.html';
            }
        );
    };

    // contact the server and get the user information and worksheet list
    getAuthenticatedJSON('/userinfo', function (data) {
        model.user(data);
    });
    getAuthenticatedJSON('/worksheets', function (data) {
        model.worksheets(data);
    });

    ko.applyBindings(model);

});