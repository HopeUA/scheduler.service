var moment   = require('moment');
var event    = require('../../model/event');
var debug    = require('debug')('app');
var co       = require('co');
var log      = require('../log');
var MediaAPI = require('../MediaAPI');

module.exports = function(agenda) {
    agenda.define('warm cache', function(job, done) {
        let moduleName = 'Cacher Warmer';
        log.info(moduleName, 'Job START');

        co(function*(){
            let now = moment().startOf('day');
            let dates = [
                moment(now).subtract(4, 'days'),
                moment(now).subtract(3, 'days'),
                moment(now).subtract(2, 'days'),
                moment(now).subtract(1, 'day'),
                now,
                moment(now).add(1, 'day'),
                moment(now).add(2, 'days'),
                moment(now).add(3, 'days'),
                moment(now).add(4, 'days')
            ];

            for (let date of dates) {
                log.info(moduleName, 'Cache');
                let events = yield event.collection.get({ date, inject: false });

                let tasks = [];
                for (let event of events) {
                    if (event.episode) {
                        tasks.push(MediaAPI.get(event.episode.code, false));
                    }
                    if (event.show) {
                        tasks.push(MediaAPI.getShow(event.show.code, false));
                    }
                }

                yield tasks;
            }

        }).then(() => {
            log.info(moduleName, 'Job DONE');
            done();
        }).catch((error) => {
            log.error(moduleName, 'Job error: ' + error);
            done();
        });
    });
};
