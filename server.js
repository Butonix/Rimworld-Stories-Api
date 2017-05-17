const bodyParser = require('body-parser');
const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser')('whatever floats your boat');
const jsonParser = require('body-parser').json();
const urlEncoded = require('body-parser').urlencoded({ extended: true });
const session = (require('express-session')({
    secret: 'whatever floats your boat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 10 * 365 * 24 * 60 * 60 * 1000
    }
}));
const mongoose = require('mongoose');
const morgan = require('morgan');
const fs = require('fs');

// Load either local config or regular config
if (fs.existsSync('./config/local')) {
    console.log('Loading local config');
    loadConfig('./config/local/config.js');
} else {
    loadConfig('./config/config.js');
}
function loadConfig (configPath) {
    return {PORT, DATABASE_URL, CLIENT_URL, FACEBOOKAUTH, CLOUDINARY_API} = require(configPath);
}

const {router: authRouter} = require('./auth');
const {router: profileRouter} = require('./profile');
const {router: storyRouter} = require('./story');
const {router: commentRouter} = require('./comment');

let server;
mongoose.Promise = global.Promise;

const app = express();

// Enable CORS
app.use((req, res, next) => {

    const allowedOrigins = [CLIENT_URL, 'https://www.rimworld-stories.com'];
    const origin = req.headers.origin;
    if (allowedOrigins.indexOf(origin) > -1) {
       res.header('Access-Control-Allow-Origin', origin);
   };
    res.header("Access-Control-Allow-Origin", 'https://www.rimworld-stories.com');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
	res.header("Access-Control-Allow-Credentials", true);
    if ('OPTIONS' == req.method) {
      res.sendStatus(200);
    }
    else {
      next();
    }
});

app.use(morgan('common'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser);
app.use(jsonParser);
app.use(urlEncoded);
app.use(session);

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth/', authRouter);
app.use('/profile/', profileRouter);
app.use('/story/', storyRouter);
app.use('/comment/', commentRouter);

app.use('*', (req, res) => {
    return res.status(404).json({message: '404 - Not Found'});
});

function runServer(databaseUrl = DATABASE_URL) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
            if (err) {
                return reject(err);
            }
            server = app.listen(PORT, () => {
                console.log(`Your app is listening on port ${PORT}`);
                resolve();
            })
            .on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        });
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('Closing server');
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    });
}

if (require.main === module) {
    runServer().catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};
