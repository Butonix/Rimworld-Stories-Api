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
        .catch(err => {
            res.status(500).json({
                alert: { message: 'Error when fetching user profile: ' + err, timer: 10, type: 'error-message' }
            });
        });
});

module.exports = {router};
