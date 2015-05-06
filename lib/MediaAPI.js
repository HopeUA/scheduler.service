'use strict';

var Event  = require('../model/event');
var debug   = require('debug')('app');
var config  = require('config');
var request = require('request');

var mediaAPIendpoint = config.get('mediaApi.endpoint');
var mediaAPItoken    = config.get('mediaApi.token');

module.exports = {
    get: (code) => {
        return new Promise((resolve, reject) => {
            var url = mediaAPIendpoint + '/episodes/' + code + '?token=' + mediaAPItoken;

            var options = {
                url: url
            };

            request(options, function(error, response, body){
                if (error) {
                    return resolve(JSON.parse(error));
                }

                resolve(JSON.parse(body));
            });
        })
    }
};
