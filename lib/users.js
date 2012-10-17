
users = {
    'jony': {
        userID: 123,
        username: 'jony',
        passwordHash:  '$2a$10$3g74oBsUTsfYUU74x/tQHuBF6BVdRDWn0Mva/au05yLx/0fDZrg5a',
        admin: true
    }};

exports.findByUsername = function (username) {
    return users[username];
};