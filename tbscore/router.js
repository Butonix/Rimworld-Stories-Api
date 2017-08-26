const express = require('express');
const {TBScore} = require('../config/models');
const router = express.Router();
const mongoose = require('mongoose');
const multer  = require('multer');
const upload = multer({ dest: 'temp-uploads/' });

// GET SCORES
router.get('/', (req, res) => {
    let highScores = [];
    let recentScores = [];
    TBScore
        .find()
        .sort({ score: -1 })
        .limit(10)
        .then((scores) => {
            highScores = scores;
            TBScore
                .find()
                .sort({ datePosted: -1 })
                .limit(5)
                .then((scores) => {
                    recentScores = scores;
                    res.json({
                      theBrain: highScores[0] || {},
                      highScores: highScores.slice(1),
                      recentScores
                    })
                })
        })
        .catch(err => {res.json({APIerror: 'Error when fetching scores: ' + err})});
});

// ADD SCORE
router.post('/', upload.none(), (req, res) => {
    let highScores = [];
    let recentScores = [];
    TBScore
        .create({
            username: req.body.username || "UNKNOWN",
            score: req.body.score || 0
        })
        .then(() => {
            TBScore
                .find()
                .sort({ score: -1 })
                .limit(10)
                .then((scores) => {
                    highScores = scores;
                    TBScore
                        .find()
                        .sort({ datePosted: -1 })
                        .limit(5)
                        .then((scores) => {
                            recentScores = scores;
                            res.json({
                              theBrain: highScores[0] || {},
                              highScores: highScores.slice(1),
                              recentScores
                            })
                        })
                })
        })
        .catch(err => {res.json({APIerror: 'Error when fetching scores: ' + err})});
});

module.exports = {router};
