var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var logger     = require('morgan');
var router     = require('./router');
var debug      = require('debug')('app');
var RestError  = require('./lib/restError');
var config     = require('config');

/* Database */
var mongoose = require('mongoose');
mongoose.connect(config.get('mongodb.url'), () => {
    debug('DB connected');
});

/* CORS */
app.all('*', (request, response, next) => {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    response.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS, PATCH');
    next();
});
app.disable('x-powered-by');

/* JSON requests */
app.use(bodyParser.json());
/* Logger */
app.use(logger());
/* Routes */
app.use('/v1', router);

/* 404 */
app.use((request, response) => {
    response.status(404).json({
        error: {
            code: 'SCHEDULER-404',
            message: 'Resource not found'
        }
    });
});

/* Error handler */
app.use((error, request, response, next) => {
    if (!(error instanceof RestError)) {
        error = RestError.createFromError(error);
    }

    response
        .status(error.status)
        .json({
            error: {
                code:    'SCHEDULER-' + error.code,
                message: error.message,
                stack:   error.stack,
                parent: {
                    message: error.parent.message,
                    stack: error.parent.stack
                }
            }
        });
});

var port = process.env.PORT || 3000;
app.listen(port);

debug('Server started on port ' + port);