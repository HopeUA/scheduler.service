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
mongoose.connect(config.get('mongodb.url'), (error) => {
    if (error) {
        return debug(error.message);
    }
    debug('DB connected');
});

/* CORS */
app.all('*', (request, response, next) => {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    response.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS, PATCH');
    next();
});
app.disable('x-powered-by');

/* JSON requests */
app.use(bodyParser.json());
/* Logger */
app.use(logger());
/* Token */
app.use((request, response, next) => {
    const token = request.headers.authorization ?
        new Buffer(
            request.headers.authorization.replace('Bearer ', ''),
            'base64'
        ).toString('utf8')
        : null;

    let actions = [];
    if (token !== null && config.get('auth.token') === token) {
        actions.push('scheduler.events.write');
    }

    request.user = { actions };
    next();
});
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

    const errorOutput = {
        code: 'SCHEDULER-' + error.code,
        message: error.message
    };
    if (app.settings.env === 'dev') {
        errorOutput.stack  = error.stack;
        errorOutput.parent = {
            message: error.parent.message,
            stack: error.parent.stack
        };
    }

    response
        .status(error.status)
        .json({
            error: errorOutput
        });
});

var port = process.env.PORT || 3000;
app.listen(port);

debug('Server started on port ' + port);