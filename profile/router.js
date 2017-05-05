const express = require('express');
const passport = require('passport');
const {User} = require('../config/models');
const router = express.Router();
const fs = require('fs');
const {ensureLogin} = require('../utils');
const cloudinary = require('cloudinary');
var multer  = require('multer')
var upload = multer({ dest: 'temp-uploads/' })

// Load either local config or regular config
if (fs.existsSync('./config/local')) {
    console.log('Loading local FB config');
    loadConfig('../config/local/config.js');
} else {
    loadConfig('../config/config.js');
}
function loadConfig (configPath) {
    return {FACEBOOKAUTH, CLIENT_URL, CLOUDINARY_API} = require(configPath);
}

cloudinary.config(CLOUDINARY_API);

// GET PROFILE
router.get('/get/:id', (req, res) => {
    return User
        .findById(req.params.id)
        .then(user => res.json(user))
        .catch(err => {res.json({APIerror: 'Error when fetching user profile: ' + err})});
});

// UPLOAD AVATAR
router.post('/upload-avatar', upload.single('file'), ensureLogin, (req, res, next) => {
    cloudinary.v2.uploader.upload(req.file.destination + req.file.filename, {
        public_id: 'avatars/' + req.user._id,
        transformation: [
          {width: 400, height: 400, gravity: "face", crop: "crop"},
          {width: 200, crop: "scale"}
        ]},
        (err, result) => {
        User
            .findOneAndUpdate({_id: req.user._id}, {avatarUrl: result.secure_url})
            .catch((err) => {
                fs.unlink(req.file.destination + req.file.filename, console.log('Temp file successfully deleted: ' + req.file.destination + req.file.filename));
                res.json({APIerror: 'Error when saving new avatar to DB: ' + err});
            });
        fs.unlink(req.file.destination + req.file.filename, console.log('Temp file successfully deleted: ' + req.file.destination + req.file.filename));
        return result
        })
        .then((result) => res.json({
            currentUser: {avatarUrl: result.secure_url},
            APImessage: 'New avatar successfully uploaded!'
        }))
        .catch(err => {res.json({APIerror: 'Error when trying to upload image: ' + err})});
})

// CHANGE USERNAME
router.post('/change-username', ensureLogin, (req, res) => {
    username = req.body.username.trim();
    if (username.length < 3 || username.length > 15) {
        return res.json({APIerror: 'Your username should contain between 3 and 15 characters'})
    }
    if (typeof username !== 'string') {
        return res.json({APIerror: 'Incorrect type'})
    }
    return User
        .findOne({username: username})
        .then(user => {
            if (user) {
                res.json({APIerror: 'This username is already taken, please choose another one'})
            } else {
                return User
                    .findOneAndUpdate({username: username})
                    .then(() => res.json({
                        currentUser: {userName: username},
                        APImessage: 'User name successfully changed!'
                    }))
            }
        })
        .catch(err => {res.json({APIerror: 'Error when fetching user profile: ' + err})});
});

module.exports = {router};
