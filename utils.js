const fs = require('fs');

const ensureLogin = (req, res, next) => {
    if (req.isAuthenticated() && !req.user.banned) {
        next();
    } else {
        if (req.file) {
            fs.unlink(req.file.destination + req.file.filename, console.log('Temp file successfully deleted'));
        }
        res.json({APIerror: 'Please log in first'});
    }
};

module.exports = {ensureLogin};
