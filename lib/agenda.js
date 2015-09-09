var Agenda = require('agenda');
var config = require('config');
var agenda = new Agenda({db: { address: config.get('mongodb.url2') }});
var debug    = require('debug')('app');

/* Database */
var mongoose = require('mongoose');
mongoose.connect(config.get('mongodb.url'), () => {
    debug('DB connected');
});

var jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : [];

jobTypes.forEach(function(type) {
    require('./jobs/' + type)(agenda);
});

if(jobTypes.length) {
    agenda.start();
}

module.exports = agenda;
