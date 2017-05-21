const express = require('express');
const passport = require('passport');
const {User, Story, Comment} = require('../config/models');
const router = express.Router();
const fs = require('fs');
const {ensureLogin} = require('../utils');
const multer  = require('multer');
const upload = multer({ dest: 'temp-uploads/' });

// DELETE COMMENT
router.delete('/:id', ensureLogin, (req, res) => {
    Story
        .findById(req.body.storyID)
        .update({ $pullAll: { comments: [ req.params.id ] } })
        .then(() => {
            return Comment
                .findByIdAndRemove(req.params.id)
        })
        .then(() => {
            return Comment
                .find()
                .where({story: req.body.storyID})
                .populate('author', 'username avatarUrl')
        })
        .then((comments) => {
            res.json({
                APImessage: 'Comment deleted',
                comments
            })
        })
        .catch(err => {res.json({APIerror: 'Error when deleting comment: ' + err})});
});

// POST NEW COMMENT
router.post('/new-comment', upload.none(), ensureLogin, (req, res) => {
    if (!req.body.comment) {
        return res.json({APIerror: 'Your comment is empty'})
    }
    return Comment
        .create({
            author: req.user.id,
            comment: req.body.comment,
            story: req.body.story,
            datePosted: Date.now()
        })
        .then((comment) => {
            return Story
                .findByIdAndUpdate(comment.story, { $push: { comments: comment } })
        })
        .then((story) => {
            return Comment
                .find()
                .where({story: story._id})
                .populate('author', 'username avatarUrl')
        })
        .then((comments) => {
            return res.json({
                APImessage: 'Comment posted',
                comments
            })
        })
        .catch(err => {res.json({APIerror: 'Error when creating comment: ' + err})});
});

module.exports = {router};
