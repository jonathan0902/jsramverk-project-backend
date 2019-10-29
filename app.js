const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require("body-parser");
const login = require('./routes/login');
const stock = require('./routes/stock');
const money = require('./routes/money');

require('dotenv').config();

const app = express();
const port = 8334;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// don't show the log when it is test
if (process.env.NODE_ENV !== 'test') {
    // use morgan to log at command line
    app.use(morgan('combined')); // 'combined' outputs the Apache style LOGs
}

app.use('/login', login);
app.use('/stock', stock);
app.use('/money', money);

// Add routes for 404 and error handling
// Catch 404 and forward to error handler
// Put this last
app.use((req, res, next) => {
    var err = new Error("Not Found");

    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        "errors": [
            {
                "status": err.status,
                "title":  err.message,
                "detail": err.message
            }
        ]
    });
});

const server = app.listen(port, () => console.log(`Example API listening on port ${port}!`));

module.exports = server;
