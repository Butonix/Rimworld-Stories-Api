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

// GET STORY
router.get('/get/:id', (req, res) => {
    Story
        .findById(req.params.id)
        .populate('author', 'username avatarUrl')
        .then((story) => {
            res.json({currentStory: story})
        })
        .catch(err => {res.json({APIerror: 'Error when fetching story: ' + err})});
});

// UPLOAD SCREENSHOT
router.post('/upload-screenshot', upload.single('file'), ensureLogin, (req, res, next) => {
    console.log(req.body);
    if (req.body.storyID === 'null') {
        fs.unlink(req.file.destination + req.file.filename, console.log('Temp file successfully deleted'));
        return res.json({ APIerror: 'You must save this story as a draft first before uploading a screenshot' });
    }
    cloudinary.v2.uploader.upload(req.file.destination + req.file.filename, {
            public_id: req.body.folder + '/' + req.body.storyID,
            transformation: JSON.parse(req.body.transformation)
        },
        (err, result) => {
            Story
                .findOneAndUpdate({ _id: req.body.storyID }, { screenshot: result.secure_url })
                .catch((err) => {
                    fs.unlink(req.file.destination + req.file.filename, console.log('Temp file successfully deleted'));
                    res.json({ APIerror: 'Error when saving new avatar to DB: ' + err });
                });
            fs.unlink(req.file.destination + req.file.filename, console.log('Temp file successfully deleted'));
            return result
        })
        .then((result) => {
            res.json({
                type: 'screenshot',
                imgUrl: result.secure_url,
                APImessage: 'New screenshot successfully uploaded!'
            })
        })
        .catch(err => {res.json({APIerror: 'Error when trying to upload image: ' + err })});
})

// GET LANDING STORIES
router.get('/get-list', upload.none(), (req, res) => {
    return Story
        .find()
        .populate('author', 'username avatarUrl')
        .sort({'datePosted': -1})
        .then((stories) => {
            res.json({stories})
        })
        .catch(err => {res.json({APIerror: 'Error when fetching stories: ' + err})});
});

// SET STORY TO BE LATEST DRAFT
router.put('/set-to-latest-draft', upload.none(), ensureLogin, (req, res) => {
    console.log(req.body)
    return Story
        .findOneAndUpdate({_id: req.body.id}, {datePosted: Date.now()})
        .then((story) => {
            res.json({redirect: '/new-story'})
        })
        .catch(err => {res.json({APIerror: 'Error when fetching stories: ' + err})});
});

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
