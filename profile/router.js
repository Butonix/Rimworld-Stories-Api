const express = require('express');
const passport = require('passport');
const {User} = require('../config/models');
const router = express.Router();
const fs = require('fs');
const {ensureLogin} = require('../utils');
const cloudinary = require('cloudinary');
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

cloudinary.config({
  cloud_name: 'zeropointtwo',
  api_key: '891646445961772',
  api_secret: 'CCGtenMr5mPVCisHOegA7PG-dDM'
});

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

// UPLOAD AVATAR
router.post('/upload-avatar', upload.single('file'), (req, res, next) => {
    cloudinary.v2.uploader.upload(req.file.destination + req.file.filename, {
        folder: 'avatars',
        transformation: [
          {width: 400, height: 400, gravity: "face", crop: "crop"},
          {width: 200, crop: "scale"}
        ]},
        (err, result) => {
        User
            .findOneAndUpdate({_id: req.body.user}, {avatarUrl: result.secure_url})
            .catch(err => {res.json({APIerror: 'Error when saving new avatar to DB: ' + err})});
        return result
        })
        .then((result) => res.json({
            currentUser: {avatarUrl: result.secure_url},
            APImessage: 'New avatar successfully uploaded!'
        }))
        .catch(err => {res.json({APIerror: 'Error when trying to upload image: ' + err})});
})

// CHANGE USERNAME
router.post('/change-username', (req, res) => {
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
