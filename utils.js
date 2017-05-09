const fs = require('fs');
const {User, Story} = require('./config/models');

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

const loadUser = (req, res) => {
    Story
        .find()
        .where('author').equals(req.user._id)
        .then((stories) => {
            res.json({
                isLoggedIn: true,
                currentUser: {
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    avatarUrl: req.user.avatarUrl,
                    stories: stories
                }
            });
        })
}

module.exports = {ensureLogin, loadUser};
