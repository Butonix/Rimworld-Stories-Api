const express = require('express');
const passport = require('passport');
const {User} = require('../config/models');
const router = express.Router();
const fs = require('fs');
const {ensureLogin} = require('../utils');

// Load either local config or regular config
if (fs.existsSync('./config/local')) {
    console.log('Loading local FB config');
    loadConfig('../config/local/config.js');
} else {
    loadConfig('../config/config.js');
}
function loadConfig (configPath) {
    return {FACEBOOKAUTH, CLIENT_URL} = require(configPath);
}

// GET PROFILE
router.get('/get/:id', (req, res) => {
    return User
        .findById(req.params.id)
        .then(user => res.json(user))
        .catch(err => {res.json({APIerror: 'Error when fetching user profile: ' + err})});
});

// CHANGE USERNAME
router.post('/change-username', (req, res) => {
    console.log(req.body);
    return User
        .findOne({username: req.body.username})
        .then(user => {
            if (user) {
                res.json({APIerror: 'This username is already taken, please choose another one'})
            } else {
                return User
                    .findOneAndUpdate({username: req.body.username})
                    .then(() => res.json({
                        currentUser: {userName: req.body.username},
                        APImessage: 'User name successfully changed!'
                    }))
            }
        })
        .catch(err => {res.json({APIerror: 'Error when fetching user profile: ' + err})});
});

module.exports = {router};
