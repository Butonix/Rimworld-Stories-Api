const express = require('express');
const {TBScore} = require('../config/models');
const router = express.Router();
const mongoose = require('mongoose');
const multer  = require('multer');
const upload = multer({ dest: 'temp-uploads/' });

// GET SCORES
router.get('/', (req, res) => {
    TBScore
        .find()
        .sort({ score: -1 })
        .then((scores) => {
            res.json(scores)
        })
        .catch(err => {res.json({APIerror: 'Error when fetching scores: ' + err})});
});

// ADD SCORE
router.post('/', upload.none(), (req, res) => {
    TBScore
        .create({
            username: req.body.username || "UNKNOWN",
            score: req.body.score || 0
        })
        .then(() => {
            TBScore
                .find()
                .sort({ score: -1 })
                .then((scores) => {
                    res.json(scores)
                })
        })
        .catch(err => {res.json({APIerror: 'Error when fetching scores: ' + err})});
});

module.exports = {router};
