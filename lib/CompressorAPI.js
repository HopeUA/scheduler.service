var debug   = require('debug')('app');
var config  = require('config');
var request = require('request');
var log     = require('./log');
var MediaAPI = require('./MediaAPI');

var compressorAPIendpoint = config.get('compressorApi.endpoint');
var compressorAPItoken    = config.get('compressorApi.token');
var moduleName = 'Compressor API';

var fetchUrl = function(url, data = null) {
    return new Promise((resolve, reject) => {
        var options = {
            url: url,
            headers: {
                Authorization: 'Bearer ' + compressorAPItoken,
                'Content-Type': 'application/json'
            }
        };
        if (data) {
            options.method = 'POST';
            options.body = JSON.stringify(data);
        }

        request(options, function(error, response, body){
            if (error) {
                return resolve(JSON.parse(error));
            }

            resolve(JSON.parse(body));
        });
    });
};

const api = {
    exists: async (code) => {
        let url = compressorAPIendpoint + '/jobs?uid=' + code;

        let result = await fetchUrl(url);
        if (result.error || !result.meta) {
            throw new Error('Unknown response from compressor: ', result.error.message);
        }

        return result.meta.total > 0;
    },
    add: async (code) => {
        log.info(moduleName, 'Add ' + code);

        let isExists = await api.exists(code);
        if (isExists) {
            return true;
        }

        const episode = await MediaAPI.get(code);
        if (!episode) {
            return;
        }

        let url = compressorAPIendpoint + '/jobs';
        const data = {
            uid: code,
            data: {
                input: `https://storage-media.s.hope.ua/${episode.show.uid}/source/${code}.mov`,
                output: `https://storage-media.s.hope.ua/${episode.show.uid}/stream-16:9/${code}.mp4`,
                meta: {
                    show: episode.show.title,
                    episode: code,
                    title: episode.title
                }
            },
            // published: false,
            priority: 200
        };
        let result = await fetchUrl(url, data);

        if (result.error) {
            log.error(moduleName, code + ' Result error: ' + result.error.message);
        } else {
            log.info(moduleName, code + ' Result saved');
        }
    }
};

module.exports = api;