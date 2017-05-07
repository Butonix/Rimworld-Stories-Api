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

// SAVE DRAFT
router.post('/save-draft', upload.none(), ensureLogin, (req, res) => {
    if (req.body.title === '' && req.body.story === '') {
        return res.json({})
    }
    // update current draft
    if (req.body.id !== 'null') {
        return Story
            .findOneAndUpdate( {_id: req.body.id},
            {
                author: req.user.id,
                title: req.body.title,
                story: req.body.story,
                status: req.body.status,
                datePosted: Date.now()
            })
            .then(() => {
                res.json({ APImessage: 'Draft auto saved' })
            })
            .catch(err => {res.json({APIerror: 'Error when saving draft: ' + err})});
    } else {
        // create new draft
        if (req.body.title === '' && req.body.story === '') {
            return res.json({})
        }
        return Story
            .create({
                author: req.user.id,
                title: req.body.title,
                story: req.body.story,
                status: 'draft',
                datePosted: Date.now()
            })
            .then((story) => {
                res.json({
                    APImessage: 'Draft auto saved',
                    storyID: story._id
                })
            })
            .catch(err => {res.json({APIerror: 'Error when saving draft: ' + err})});
    }
});

// PUBLISH STORY
router.post('/new', upload.none(), ensureLogin, (req, res) => {
    console.log(req.body);
    return Story
        .create({
            author: req.user.id,
            title: req.body.title,
            story: req.body.story,
            status: 'published'
        })
        .then(() => {
            res.json({
                redirect: '/',
                APImessage: 'Story successfully published!'
            })
        })
        .catch(err => {res.json({APIerror: 'Error when submitting new story: ' + err})});
});

// UPDATE STORY
router.put('/update', upload.none(), ensureLogin, (req, res) => {
    console.log(req.body);
    return Story
        .findOneAndUpdate( {_id: req.body.id},
        {
            author: req.user.id,
            title: req.body.title,
            story: req.body.story,
            status: req.body.status,
            datePosted: Date.now()
        })
        .then(() => {
            res.json({
                redirect: '/',
                APImessage: 'Story successfully updated!'
            })
        })
        .catch(err => {res.json({APIerror: 'Error when submitting new story: ' + err})});
});

module.exports = {router};
