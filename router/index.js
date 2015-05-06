var router = require('express').Router();
var events = require('./events');

router.use('/events', events);

module.exports = router;