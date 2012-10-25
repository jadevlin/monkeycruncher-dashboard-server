exports.logErrorAndRedirect = function (request, response, logMessage, err, userMessage, redirectURL) {
    console.log(logMessage);
    console.error(err);
    request.session.message = userMessage;
    response.redirect(redirectURL);
};