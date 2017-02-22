var debug   = require('debug')('app');
var config  = require('config');
var request = require('request');
var log     = require('./log');
var MediaAPI = require('./MediaAPI');

var compressorAPIendpoint = config.get('compressorApi.endpoint');
var compressorAPItoken    = config.get('compressorApi.token');
var moduleName = 'Compressor API';

var fetchUrl = function(url, data = null, method = 'GET') {
    return new Promise((resolve, reject) => {
        var options = {
            url: url,
            headers: {
                Authorization: 'Bearer ' + compressorAPItoken,
                'Content-Type': 'application/json'
            },
            method
        };
        if (data) {
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
    getByCode: async (code) => {
        let url = compressorAPIendpoint + '/jobs?uid=' + code;

        let result = await fetchUrl(url);
        if (result.error || !result.meta) {
            throw new Error('Unknown response from compressor: ', result.error.message);
        }

        if (!result.meta.total) {
            return null;
        }

        return result.jobs[0];
    },
    add: async (code) => {
        log.info(moduleName, 'Add ' + code);

        let job = await api.getByCode(code);
        if (job) {
            if (job.status === 'new') {
                return api.prioritize(code, job);
            }

            return true;
        }

        const episode = await MediaAPI.get(code);
        if (!episode) {
            return false;
        }

        let url = compressorAPIendpoint + '/jobs';
        const data = {
            uid: code,
            data: {
                input: `https://storage-media.s.hope.ua/${episode.show.uid}/source/${code}.mov`,
                output: `https://storage-media.s.hope.ua/${episode.show.uid}/stream-16:9/${code}.mp4`,
                preset: episode.ratio == '4:3' ? '4/3->Stream' : '16/9->Stream',
                meta: {
                    show: episode.show.title,
                    episode: code,
                    title: episode.title
                }
            },
            // published: false,
            priority: 200
        };
        let result = await fetchUrl(url, data, 'POST');

        if (result.error) {
            log.error(moduleName, code + ' Result error: ' + result.error.message);
        } else {
            log.info(moduleName, code + ' Result saved');
        }
    },
    prioritize: async (code, job) => {
        const episode = await MediaAPI.get(code);
        if (!episode) {
            return;
        }

        let url = compressorAPIendpoint + '/jobs/' + job.id;
        const data = {
            priority: 201
        };

        let result = await fetchUrl(url, data, 'PUT');

        if (result.error) {
            log.error(moduleName, code + ' Result error: ' + result.error.message);
        } else {
            log.info(moduleName, code + ' Result saved');
        }
    }
};

module.exports = api;
