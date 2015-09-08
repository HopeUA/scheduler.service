'use strict';

var co      = require('co');
var Event   = require('../model/event');
var cache   = require('./cache');
var debug   = require('debug')('app');
var config  = require('config');
var request = require('request');


var mediaAPIendpoint = config.get('mediaApi.endpoint');
var mediaAPItoken    = config.get('mediaApi.token');

var ttl = 60 * 60 * 24;

var fetchUrl = function(url) {
    return new Promise((resolve, reject) => {
        var options = {
            url: url
        };

        request(options, function(error, response, body){
            if (error) {
                return resolve(JSON.parse(error));
            }

            resolve(JSON.parse(body));
        });
    });
};

var getFromCache = function(key) {
    return new Promise((resolve, reject) => {
        cache.get(key, (error, value) => {
            if (error) {
                return reject(error);
            }
            resolve(value);
        });
    });
};

module.exports = {
    get: (code) => {
        return co(function*(){
            let cacheKey = 'episode-' + code;

            debug('['+code+'] get data');
            let result = yield getFromCache(cacheKey);
            debug('['+code+'] Cache');
            if (result == null) {
                let url = mediaAPIendpoint + '/episodes/' + code + '?token=' + mediaAPItoken;
                result = yield fetchUrl(url);
                debug('['+code+'] API');
                cache.set(cacheKey, result, ttl);
            }

            if (result.error) {
                return null;
            }

            return result;
        });
    },
    getShow: (code) => {
        return co(function*(){
            let cacheKey = 'show-' + code;

            debug('['+code+'] get data');
            let result = yield getFromCache(cacheKey);
            debug('['+code+'] Cache');
            if (result == null) {
                let url = mediaAPIendpoint + '/shows/' + code + '?token=' + mediaAPItoken;
                result = yield fetchUrl(url);
                debug('['+code+'] API');
                if (!result.error) {
                    cache.set(cacheKey, result, ttl);
                }
            }

            return result;
        });
    }
};
