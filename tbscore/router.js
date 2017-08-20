const express = require('express');
const {TBScore} = require('../config/models');
const router = express.Router();
const mongoose = require('mongoose');

// GET SCORES
router.get('/get', (req, res) => {
    TBScore
        .find()
        .then((scores) => {
            res.json(scores)
        })
        .catch(err => {res.json({APIerror: 'Error when fetching scores: ' + err})});
});

module.exports = {router};
