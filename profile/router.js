const express = require('express');
const passport = require('passport');
const {User, Story} = require('../config/models');
const router = express.Router();
const fs = require('fs');
const {ensureLogin} = require('../utils');
const cloudinary = require('cloudinary');
var multer  = require('multer');
var upload = multer({ dest: 'temp-uploads/' });

cloudinary.config(CLOUDINARY_API);

// GET PROFILE
router.get('/get/:id', (req, res) => {
    Story
        .find()
        .where('author').equals(req.params.id)
        .then((stories) => {
            return User
                .findById(req.params.id)
                .then((user) => {
                    if (req.user && req.user.id === req.params.id) {
                        res.json(user.myProfileRep(stories))
                    } else {
                        res.json(user.otherProfileRep(stories))
                    }
                })
                .catch(err => {res.json({APIerror: 'Error when fetching user info: ' + err})});
        })
        .catch(err => {res.json({APIerror: 'Error when fetching user stories: ' + err})});
});

// UPLOAD AVATAR
router.post('/upload-avatar', upload.single('file'), ensureLogin, (req, res, next) => {
    console.log(req.body);
    cloudinary.v2.uploader.upload(req.file.destination + req.file.filename, {
            public_id: req.body.folder + '/' + req.user._id,
            transformation: JSON.parse(req.body.transformation)
        },
        (err, result) => {
            User
                .findOneAndUpdate({ _id: req.user._id }, { avatarUrl: result.secure_url })
                .catch((err) => {
                    fs.unlink(req.file.destination + req.file.filename, console.log('Temp file successfully deleted'));
                    res.json({ APIerror: 'Error when saving new avatar to DB: ' + err });
                });
            fs.unlink(req.file.destination + req.file.filename, console.log('Temp file successfully deleted'));
            return result
        })
        .then((result) => {
            res.json({
                type: 'avatar',
                currentUser: { avatarUrl: result.secure_url },
                APImessage: 'New avatar successfully uploaded!'
            })
        })
        .catch(err => {res.json({APIerror: 'Error when trying to upload image: ' + err })});
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
                        currentUser: {username: username},
                        APImessage: 'User name successfully changed!'
                    }))
            }
        })
        .catch(err => {res.json({APIerror: 'Error when fetching user profile: ' + err})});
});

module.exports = {router};
