const fs = require('fs');

const ensureLogin = (req, res, next) => {
    if (req.user && req.isAuthenticated() && !req.user.banned) {
        next();
    } else {
        if (req.file) {
            fs.unlink(req.file.destination + req.file.filename, console.log('Temp file successfully deleted: ' + req.file.destination + req.file.filename));
        }
        res.json({
            APIerror: 'You are logged out. Please log in first',
            redirect: '/login'
        });
    }
};

module.exports = {ensureLogin};
