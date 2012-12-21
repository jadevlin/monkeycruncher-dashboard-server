var express = require('express'),
    users = require('./lib/users'),
    usersMW = require('./lib/users-mw'),
    worksheets = require('./lib/worksheets'),
    worksheetsMW = require('./lib/worksheets-mw'),
    authMW = require('./lib/authentication-mw'),
    sessionStore = require('./lib/session-store');

// configuration variables
var port = process.env.PORT || 5000;
var sessionSecret = process.env.SESSION_SECRET || "a very secret string";
var editServerURL = process.env.EDIT_SERVER_URL || "http://edit-server.localhost:5050/";
var sharedSecret = process.env.SHARED_SECRET || "a secret for inter-app communication";

// configure the server
var app = express();
app.enable("trust proxy");
// default middleware
app.use(express.favicon());
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ store: sessionStore.createStore(express), secret: sessionSecret }));
app.use(app.router);
app.use(express.static(__dirname + '/static'));
app.use(express.errorHandler());


// ** Client-facing API **

// authentication
// requires parameters username and password in request body
app.post('/authenticate',
    authMW.checkCredentials
);
app.post('/logout',
    authMW.logout
);
// registration
// requires parameters username, password and email in request body
app.post('/register',
    usersMW.register
);
//user
app.get('/userinfo',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    function (request, response) {
        var user = response.locals.user;
        delete user.passwordHash;
        response.json(user);
    }
);
// worksheets
app.get('/worksheets',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.loadAllWorksheets,
    function (request, response) {
        response.json(response.locals.worksheets);
    }
);
app.post('/worksheets/create/:name',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.create(editServerURL, sharedSecret)
);
app.post('/worksheets/delete/:id',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.mustBeWorksheetOwner,
    worksheetsMW.loadWorksheet,
    worksheetsMW.delete(editServerURL, sharedSecret)
);
app.post('/worksheets/authorizeEdit/:id',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.mustBeWorksheetOwner,
    worksheetsMW.loadWorksheet,
    worksheetsMW.authorizeEdit(editServerURL, sharedSecret)
);

//app.get('/fork/:newUUID',
//    authMW.requireAuthenticated,
//    function (request, response, next) {
//        worksheets.addWorksheetToDB(
//            request.session.userID,
//            "Cloned worksheet",
//            request.params.newUUID,
//            function (err, newID) {
//                if (err) return next(err);
//                worksheets.loadWorksheet(newID, function (err, worksheet) {
//                    if (err) next(err);
//                    response.locals.worksheet = worksheet;
//                    worksheetsMW.edit(editServerURL, sharedSecret, 'edit')(request, response, next);
//                });
//            }
//        );
//    }
//);

// start the server
app.listen(port, function () {
    console.log("Listening on " + port)
});
