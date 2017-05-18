const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const {User, Story} = require('../config/models');
const router = express.Router();
const faker = require('faker');
const fs = require('fs');
const {ensureLogin, loadUser} = require('../utils');
const multer  = require('multer');
const upload = multer({ dest: 'temp-uploads/' });

// CREATE NEW USER
router.post('/signup', upload.none(), (req, res) => {
    if (!req.body) {
        return res.json({APIerror: 'No request body'});
    }
    if (!('username' in req.body)) {
        return res.json({APIerror: 'Missing field: Username'});
    }
    if (!('email' in req.body)) {
        return res.json({APIerror: 'Missing field: E-mail'});
    }
    if (!('password' in req.body)) {
        return res.json({APIerror: 'Missing field: Password'});
    }

    let {username, password, email} = req.body;

    if (typeof username !== 'string') {
        return res.json({APIerror: 'Incorrect field type: username'});
    }

    username = username.trim();
    email = email.trim();
    password = password.trim();

    if (username === '') {
        return res.json({APIerror: 'You must provide a user name'});
    }
    if (username.length < 3 || username.length > 13) {
        return res.json({APIerror: 'Your username should have between 3 and 13 characters'});
    }
    if (email === '') {
        return res.json({APIerror: 'You must provide an email address'});
    }
    if (!(password)) {
        return res.json({APIerror: 'You must provide a password'});
    }
    if (typeof password !== 'string') {
        return res.json({APIerror: 'Incorrect field type: password'});
    }
    if (password === '') {
        return res.json({APIerror: 'You must provide a password'});
    }

    // check for existing user
    return User
    .find({email : email})
    .count()
    .then(count => {
        if (count > 0) {
            return res.json({APIerror: 'This email address is already registered'});
        }
    // if no existing user, hash password
    return User.hashPassword(password);
    })
    .then(hash => {
        return User
        .create({
            username: username,
            password: hash,
            email: email,
            authType: 'normal',
        });
    })
    .then(user => {
        return res.json({APImessage: 'Account created! You can now log in with your credentials.'});
    })
    .catch(err => {
        return res.json({APIerror: err.errmsg});
    });
});

// LOG IN
router.post('/login', upload.none(), passport.authenticate('local'), ensureLogin, (req, res, next) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) {
            return res.json({APIerror: 'Incorrect email/password.'});
        }
        return res.json({
            APImessage: 'Login successful',
            redirect: '/profile/' + req.user.id
        });
    });
});

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
    profileFields: ["emails", "displayName", 'picture.type(large)']
  },
  function(accessToken, refreshToken, profile, cb) {
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
            .then(user => cb(null, user))
            .catch(err => {return cb(null, false, {message: 'Incorrect password'});});
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
        APImessage: 'You are now logged out',
        redirect: '/'
     });
});

// GET USER
router.get('/get-user', (req, res) => {
    if (req.isAuthenticated()) {
        loadUser(req, res);
    } else {
        res.json({isLoggedIn: false});
    }
});

// ENSURE LOGIN
router.get('/ensure-login', ensureLogin, (req, res) => {
    loadUser(req, res);
});

// LOGIN WITH FB
router.get('/facebook', passport.authenticate('facebook', { scope : ['email'] }));

// FB CALLBACK
router.get('/facebook/callback', passport.authenticate('facebook', { scope : ['email'] }), ensureLogin, (req, res) => {
    res.redirect(CLIENT_URL + '/profile/' + req.user._id);
});

module.exports = {router};
