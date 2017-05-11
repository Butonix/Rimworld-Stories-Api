const express = require('express');
const passport = require('passport');
const {User, Story, Comment} = require('../config/models');
const router = express.Router();
const fs = require('fs');
const {ensureLogin} = require('../utils');
const cloudinary = require('cloudinary');
const multer  = require('multer');
const upload = multer({ dest: 'temp-uploads/' });
const mongoose = require('mongoose');

cloudinary.config(CLOUDINARY_API);

// DELETE STORY
router.delete('/:id', ensureLogin, (req, res) => {
    Story
        .findOneAndRemove({_id: req.params.id})
        .then(() => {
            return Comment
                .find()
                .where({story: req.params.id})
                .remove()
        })
        .then(() => {
            res.json({
                APImessage: 'Story deleted',
                redirect: '/'
            })
        })
        .catch(err => {res.json({APIerror: 'Error when deleting comment: ' + err})});
});

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
                    return res.json({
                        APImessage: 'Your latest draft has been loaded',
                        currentDraft: latestDraft
                    })
                } else {
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
    let status, date;
    if (req.body.status === 'published') {
        date = req.body.datePosted;
        status = 'published';
    } else {
        date = Date.now();
        status = 'draft';
    }
    // update current draft
    return Story
        .findOneAndUpdate( {_id: req.body.id},
        {
            author: req.user.id,
            title: req.body.title,
            story: req.body.story,
            status: status,
            datePosted: date
        })
        .then(() => {
            res.json({ APImessage: 'Draft saved' })
        })
        .catch(err => {res.json({APIerror: 'Error when saving draft: ' + err})});
});

// GET STORY
router.get('/get/:id', (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {res.json({
          APIerror: 'Invalid story ID',
          redirect: '/'
        })
    }
    return Story
        .findById(req.params.id)
        .update({$inc: {views:1}})
        .then(() => {
            return Story
                .findById(req.params.id)
                .populate('author', 'username avatarUrl')
                .populate({
                     path: 'comments',
                     populate: {
                       path: 'author',
                       select: 'username avatarUrl',
                       model: 'User'
                     }
                  })
        })
        .then((story) => {
          res.json({currentStory: story})
        })
        .catch(err => {res.json({
          APIerror: 'This story doesn\'t exist',
          redirect: '/'
        })})
});

// UPLOAD SCREENSHOT
router.post('/upload-screenshot', upload.single('file'), ensureLogin, (req, res, next) => {
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
        .where({status: 'published'})
        .populate('author', 'username avatarUrl')
        .sort({'datePosted': -1})
        .then((stories) => {
            if (stories.length === 0) {
                return res.json({stories: ['none']})
            }
            return res.json({stories})
        })
        .catch(err => {res.json({APIerror: 'Error when fetching stories: ' + err})});
});

// UPDATE STORY
router.put('/update', upload.none(), ensureLogin, (req, res) => {
    let date, message;
    if (req.body.title === '') {
        return res.json({APIerror: 'Your story needs a title'})
    }
    if (req.body.story === '') {
        return res.json({APIerror: 'Your story cannot be empty'})
    }
    if (req.body.status === 'published') {
        date = req.body.datePosted;
        message = 'Story successfully created';
    } else {
        date = Date.now();
        message = 'Story successfully posted';
    }
    return Story
        .findOneAndUpdate( {_id: req.body.id},
        {
            author: req.user.id,
            title: req.body.title,
            story: req.body.story,
            status: 'published',
            datePosted: date
        })
        .then(() => {
            res.json({
                redirect: '/story/' + req.body.id,
                APImessage: message
            })
        })
        .catch(err => {res.json({APIerror: 'Error when submitting new story: ' + err})});
});

module.exports = {router};
