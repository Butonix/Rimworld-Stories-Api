const express = require('express');
const passport = require('passport');
const {User, Story, Comment} = require('../config/models');
const router = express.Router();
const fs = require('fs');
const {ensureLogin} = require('../utils');
const cloudinary = require('cloudinary');
var multer  = require('multer');
var upload = multer({ dest: 'temp-uploads/' });

cloudinary.config(CLOUDINARY_API);

// GET DRAFT
router.get('/get-draft/:storyID', ensureLogin, (req, res) => {
    if (req.params.storyID === 'new' || req.params.storyID === 'forceNew') {
        // check if user has previous draft, otherwise, create a new one
        Story
            .find()
            .where('author').equals(req.user._id)
            .then((stories) => {
                let latestDraft = null;
                // get latest draft
                stories.forEach((story) => {
                    latestDraft =
                    (latestDraft && story.datePosted.getTime() > latestDraft.datePosted && story.status === 'draft') ||
                    (latestDraft === null && story.status === 'draft')
                    ? story : latestDraft;
                });
                if (latestDraft && req.params.storyID !== 'forceNew') {
                    console.log('loading latest draft')
                    return res.json({
                        APImessage: 'Your latest draft has been loaded',
                        currentDraft: latestDraft
                    })
                } else {
                    console.log('creating new draft')
                    return Story
                        .create({
                            author: req.user.id,
                            title: '',
                            story: '',
                            status: 'draft',
                            datePosted: Date.now()
                        })
                        .then((story) => {
                            res.json({
                                APImessage: 'New draft created',
                                currentDraft: story,
                                redirect: '/write-story/new'
                            })
                        })
                        .catch(err => {res.json({APIerror: 'Error when creating draft: ' + err})});
                }
            })
    } else {
        // if we have to load a specific draft from :storyID
        console.log('loading specific draft')
        Story
            .findById(req.params.storyID)
            .then((story) => {
                return res.json({currentDraft: story})
            })
            .catch(err => {res.json({
                APIerror: 'Error loading draft',
                redirect: '/'
            })});
    }
});

// SAVE DRAFT
router.post('/save-draft', upload.none(), ensureLogin, (req, res) => {
    if (req.body.title === '' && req.body.story === '') {
        return res.json({})
    }
    // update current draft
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
            res.json({ APImessage: 'Draft saved' })
        })
        .catch(err => {res.json({APIerror: 'Error when saving draft: ' + err})});
});

// GET STORY
router.get('/get/:id', (req, res) => {
    return Comment
        .find()
        .where({story: req.params.id})
        .populate('author', 'username avatarUrl')
        .then((comments) => {
            Story
                .findById(req.params.id)
                .populate('author', 'username avatarUrl')
                .then((story) => {
                    story.comments = comments;
                    res.json({currentStory: story})
                })
                .catch(err => {res.json({
                    APIerror: 'This story doesn\'t exist',
                    redirect: '/'
                })});
        })
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
