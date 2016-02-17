'use strict';

var co      = require('co');
var Event   = require('../model/event');
var cache   = require('./cache');
var debug   = require('debug')('app');
var config  = require('config');
var request = require('request');
var log     = require('./log');

var mediaAPIendpoint = config.get('mediaApi.endpoint');
var mediaAPItoken    = config.get('mediaApi.token');

var ttl = 60 * 60 * 24;

var fetchUrl = function(url) {
    return new Promise((resolve, reject) => {
        const token = new Buffer('T8xuqBOEDQvKFacZtDcsCxjQ8PbO3Dexw3RD1EnHBFdAaotQ6U4AnYF3qWGMJTlr').toString('base64');
        var options = {
            url: url,
            headers: {
                Authorization: `Bearer ${token}`
            }
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

var moduleName = 'Media API';

module.exports = {
    get: async (code, cacheEnabled = true) => {
        let cacheKey = 'episode-' + code;

        let cacheMsg = cacheEnabled ? 'enabled' : 'disabled';
        log.info(moduleName, 'Get ' + code + ', cache is ' + cacheMsg);

        let result = cacheEnabled ? await getFromCache(cacheKey) : null;
        if (result == null) {
            log.info(moduleName, code + ' not found in cache');
            let url = mediaAPIendpoint + '/episodes/' + code;
            log.info(moduleName, code + ' Load ' + url);
            result = await fetchUrl(url);
            if (result.error) {
                log.error(moduleName, code + ' Result error: ' + result.error.message);
            } else {
                log.info(moduleName, code + ' Result saved to cache');
            }

            cache.set(cacheKey, result, ttl);
        } else {
            log.info(moduleName, code + ' Cache hit');
        }

        if (result.error) {
            return null;
        }

        return result;
    },
    getShow: async (code, cacheEnabled = true) => {
        let cacheKey = 'show-' + code;

        let cacheMsg = cacheEnabled ? 'enabled' : 'disabled';
        log.info(moduleName, 'Get ' + code + ', cache is ' + cacheMsg);

        let result = cacheEnabled ? await getFromCache(cacheKey) : null;
        if (result == null) {
            log.info(moduleName, code + ' not found in cache');
            let url = mediaAPIendpoint + '/shows/' + code;
            log.info(moduleName, code + ' Load ' + url);
            result = await fetchUrl(url);
            if (result.error) {
                log.error(moduleName, code + ' Result error: ' + result.error.message);
            } else {
                log.info(moduleName, code + ' Result saved to cache');
            }

            cache.set(cacheKey, result, ttl);
        }

        if (result.error) {
            return null;
        }

        return result;
    }
};
