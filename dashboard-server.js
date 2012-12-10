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
// the view engine
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
// default middleware
app.use(express.favicon());
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
//app.use(express.session({ secret: sessionSecret}));
app.use(express.session({ store: sessionStore.createStore(express), secret: sessionSecret }));
app.use(app.router);
app.use(express.static(__dirname + '/static'));
app.use(express.errorHandler());


// ** Actions **
// redirect helper function
var redirect = function (url) {
    return function (request, response) {
        response.redirect(url);
    }
};
// authentication
// requires parameters username and password in request body
app.post('/authenticate',
    authMW.checkCredentials,
    function (request, response, next) {
        // TODO: more cheeziness - this time checking for whether we should be saving the worksheet
        if (request.query.uuid){
            // TODO: HORROR!!!
            worksheets.addWorksheetToDB(
                request.session.userID,
                "Cloned worksheet",
                request.query.uuid,
                function (err) {
                    if (err) return next(err);
                    return response.redirect('/dashboard.html');
                }
            );
        }
        else next();
    },
    redirect('/dashboard.html')
);
app.get('/logout',
    authMW.logout,
    redirect('/login.html')
);
// registration
// requires parameters username, password and email in request body
app.post('/register',
    usersMW.register,
    redirect('/registration_success.html')
);
// worksheets
// requires parameter name in request body
app.post('/create',
    authMW.requireAuthenticated('/login.html'),
    usersMW.loadUser,
    worksheetsMW.create(editServerURL, sharedSecret),
    redirect('/dashboard.html')
);
// requires parameter worksheetID in request body
app.post('/delete',
    authMW.requireAuthenticated('/login.html'),
    usersMW.loadUser,
    worksheetsMW.mustBeWorksheetOwner,
    worksheetsMW.loadWorksheet,
    worksheetsMW.delete(editServerURL, sharedSecret),
    redirect('/dashboard.html')
);
// requires worksheetID in the URL. Does something really nasty to move it in to the body!
// TODO: this will be made more rational once the dashboard is made in to a single-page app.
app.get('/edit/:id',
    function (request, response, next) {
        request.body.worksheetID = request.params.id;
        next();
    }, //YUCK
    authMW.requireAuthenticated('/login.html'),
    usersMW.loadUser,
    worksheetsMW.mustBeWorksheetOwner,
    worksheetsMW.loadWorksheet,
    worksheetsMW.edit(editServerURL, sharedSecret,'edit')
);

app.get('/fork/:newUUID',
    function (request, response, next) {
        if (request.session.authenticated) {
            // if the user is logged in, then forking is fairly straightforward. We just add the document to their
            // account and direct them to the editor.
            saveWorksheet(request, response, next);
        } else {
            // if they're not logged in we send them to the editor in anonEdit mode
            // TODO: CHEEZY HACK
            response.locals.worksheet = {};
            response.locals.worksheet.documentRef = request.params.newUUID;
            worksheetsMW.edit(editServerURL, sharedSecret, 'anonEdit')(request, response, next);
        }
    }
);

var saveWorksheet = function (request, response, next) {
    worksheets.addWorksheetToDB(
        request.session.userID,
        "Cloned worksheet",
        request.params.newUUID,
        function (err, newID) {
            if (err) return next(err);
            worksheets.loadWorksheet(newID, function (err, worksheet) {
                if (err) next(err);
                response.locals.worksheet = worksheet;
                worksheetsMW.edit(editServerURL, sharedSecret, 'edit')(request, response, next);
            });
        }
    );
}


app.post('/authorizeSave/:uuid/:token',
    authMW.requireAdminApp(sharedSecret),
    function (request, response, next) {
        // TODO: token authentication for saving not yet implemented.
        response.json({status: "ok"});
    }
);

app.get('/save/:uuid/:token',
    // TODO: check token.
    function (request, response, next) {
        response.redirect('/loginRegister.html?uuid=' + request.params.uuid + '&token=' + request.params.token);
    }
);

// ** Views **
// These pages are defined as views to take advantage of the templating to keep the page style
// consistent.
var addTrivialView = function (path, viewName) {
    app.get(path, function (request, response) {
        response.render(viewName, {message: response.locals.message});
    });
};
addTrivialView('/login.html', 'login');
addTrivialView('/register.html', 'register');
addTrivialView('/registration_success.html', 'registration_success');
addTrivialView('/create.html', 'create');

// TODO: This is a bit hackish, but will do for the moment. All of this will go away when moved to a single-page app.
app.get('/delete.html',
    function (request, response) {
        var worksheetID = request.query['worksheetID'];
        response.render('delete', {worksheetID: worksheetID});
    }
);

app.get('/loginRegister.html',
    function (request, response) {
        var uuid = request.query.uuid;
        var token = request.query.token;
        var qString;
        if (uuid) qString = '?uuid=' + uuid + '&token=' + token;
        else qString = '';
        response.render('loginRegister', {qString: qString});
    }
);


// The main dashboard view - the heart of the app
app.get('/dashboard.html',
    authMW.requireAuthenticated('/login.html'),
    usersMW.loadUser,
    worksheetsMW.loadAllWorksheets,
    function (request, response) {
        response.render('dashboard',
            {
                user: response.locals.user,
                worksheets: response.locals.worksheets
            });
    });


// start the server
app.listen(port, function () {
    console.log("Listening on " + port)
});
