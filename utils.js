const ensureLogin = (req, res, next) => {
    if (req.isAuthenticated() && !req.user.banned) {
        next();
    } else {
        res.redirect(CLIENT_URL + '/auth/login');
    }
};

module.exports = {ensureLogin};
