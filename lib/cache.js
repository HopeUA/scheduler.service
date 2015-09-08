var debug    = require('debug')('app');
var CachemanMongo = require('cacheman-mongo');
var config     = require('config');

var cache = new CachemanMongo(config.get('mongodb.url'), {collection: 'cache'});

module.exports = cache;
