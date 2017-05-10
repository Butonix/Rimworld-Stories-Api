const express = require('express');
const passport = require('passport');
const {User, Story, Comment} = require('../config/models');
const router = express.Router();
const fs = require('fs');
const {ensureLogin} = require('../utils');
var multer  = require('multer');
var upload = multer({ dest: 'temp-uploads/' });

router.post('/new-comment', upload.none(), ensureLogin, (req, res) => {
    return Comment
        .create({
            author: req.user.id,
            comment: req.body.comment,
            story: req.body.story,
            datePosted: Date.now()
        })
        .then((comment) => {
            res.json({
                APImessage: 'Comment posted'
            })
        })
        .catch(err => {res.json({APIerror: 'Error when creating comment: ' + err})});
});

module.exports = {router};
