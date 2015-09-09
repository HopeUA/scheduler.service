require('babel/register');
var agenda = require('./lib/agenda');

agenda.every('00 04 * * *', 'warm cache');
