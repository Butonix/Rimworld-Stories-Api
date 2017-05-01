const express = require('express');
const fs = require('fs');
const morgan = require('morgan');

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

app.get('/api/*', (req, res) => {
    res.json({ok: true});
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

module.exports = {app};
