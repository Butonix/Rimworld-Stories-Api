const bodyParser = require('body-parser');
const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser')('whatever floats your boat');
const jsonParser = require('body-parser').json();
const urlEncoded = require('body-parser').urlencoded({ extended: true });
const session = (require('express-session')({
    secret: 'whatever floats your boat',
    resave: false, saveUninitialized: false,
    cookie: {
        maxAge: 50000
    }
}));
const mongoose = require('mongoose');
const morgan = require('morgan');
const fs = require('fs');
const {checkLogin} = require('./utils');

const {router: authRouter} = require('./auth');

let server;
mongoose.Promise = global.Promise;

// Load either local config or regular config
if (fs.existsSync('./config/local')) {
    console.log('Loading local config');
    loadConfig('./config/local/config.js');
} else {
    loadConfig('./config/config.js');
}
function loadConfig (configPath) {
    return {PORT, DATABASE_URL} = require(configPath);
}

const app = express();

// Enable CORS
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use(morgan('common'));
app.use(cookieParser);
app.use(jsonParser);
app.use(urlEncoded);
app.use(session);

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth/', authRouter);

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
