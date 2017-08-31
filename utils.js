const fs = require('fs');
const {User, Story} = require('./config/models');
const nodemailer = require('nodemailer');

// Load either local config or regular config
if (fs.existsSync('./config/local')) {
    loadConfig('./config/local/config.js');
} else {
    loadConfig('./config/config.js');
}
function loadConfig (configPath) {
    return {MAIL_PASS} = require(configPath);
}

//Setting up mailer
const transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    auth: {
        user: 'postmaster@sandbox82e9d6dc6f374890b03994540b9c6366.mailgun.org',
        pass: MAIL_PASS
    }
});

const sendMailAdmin = (message) => {
    let mailOptions = {
        from: 'nicoma63@gmail.com',
        to: 'nicoma63@gmail.com',
        subject: 'Mail from Rimworld Stories backend',
        html: message
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

const ensureLogin = (req, res, next) => {
    if (req.user && req.isAuthenticated() && !req.user.banned) {
        next();
    } else {
        if (req.file) {
            fs.unlink(req.file.destination + req.file.filename, console.log('Temp file successfully deleted: ' + req.file.destination + req.file.filename));
        }
        res.json({
            APIerror: 'You are logged out. Please log in first',
            redirect: '/login'
        });
    }
};

const loadUser = (req, res) => {
    Story
        .find()
        .where('author').equals(req.user._id)
        .then((stories) => {
            res.json({
                isLoggedIn: true,
                currentUser: {
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    avatarUrl: req.user.avatarUrl,
                    stories: stories
                }
            });
        })
}

module.exports = {ensureLogin, loadUser, sendMailAdmin};
