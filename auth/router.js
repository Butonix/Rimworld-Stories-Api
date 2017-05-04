const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const {User} = require('../config/models');
const router = express.Router();
const faker = require('faker');
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

// DEFINE AUTH STRATEGY
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    session: true
    },
    function(email, password, callback) {
        let user;
        User
        .findOne({ email: email })
        .then(_user => {
            user = _user;
            if (!user) {
                return callback(null, false, {message: 'Incorrect email'});
            }
            return user.validatePassword(password);
        })
        .then(isValid => {
            if (!isValid) {
                return callback(null, false, {message: 'Incorrect password'});
            }
            else {
                return callback(null, user);
            }
        });
}));

// DEFINE FACEBOOK STRATEGY
passport.use(new FacebookStrategy({
    clientID: FACEBOOKAUTH.clientID,
    clientSecret: FACEBOOKAUTH.clientSecret,
    callbackURL: FACEBOOKAUTH.callbackURL,
    profileFields: ["emails", "displayName", 'photos']
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile.photos[0].value)
    let user;
    User
    .findOne({ 'facebook.id': profile.id })
    .then(_user => {
        user = _user;
        if (!user) {
            console.log('user doesn\'t exist, creating');
            return User
            .create({
                username: profile.displayName,
                authType: 'facebook',
                password: faker.internet.password(),
                email: profile.emails[0].value,
                avatarUrl: profile.photos[0].value,
                facebook: {
                    id: profile.id,
                    token: accessToken
                }
            })
            .then(user => cb(null, user));
        } else {
            return cb(null, user);
        }
    });
}));

passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    User.findById(id, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    });
});

// LOG OUT
router.get('/log-out', (req, res) => {
    req.logout();
    res.json({
        currentUser: {
            id: null,
            userName: null,
            email: null
        },
        APImessage: 'You are now logged out'
    });
});

// GET USER
router.get('/get-user', (req, res) => {
    if (req.user) {
        console.log('Current user: ' + req.user.username);
    } else {
        console.log('Not logged in');
    }

    if (req.isAuthenticated()) {
        res.json({
            currentUser: {
                id: req.user.id,
                userName: req.user.username,
                email: req.user.email,
                avatarUrl: req.user.avatarUrl
            }
        });
    } else {
        res.json({
            currentUser: {
                id: null,
                userName: null,
                email: null
            }
        });
    }
});

// LOGIN WITH FB
router.get('/facebook', passport.authenticate('facebook', { scope : ['email'] }));

// FB CALLBACK
router.get('/facebook/callback', passport.authenticate('facebook', { scope : ['email'] }), ensureLogin, (req, res) => {
    res.redirect(CLIENT_URL + '/profile/' + req.user._id);
});

module.exports = {router};
