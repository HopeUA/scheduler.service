'use strict';

/*
var sampleEvent = {
    id: '507f191e810c19729de860ea',
    date: '2015-03-03T18:40:00Z',
    show: {
        code: 'JKLU',
        title: 'ДЖЕМ. Кліпи'
    },
    episode: {
        code: 'JKLU00514',
        title: 'Інеса Спасюк — Благодарю'
    }
};
*/

var debug    = require('debug')('app');
var moment   = require('moment');
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var RestError = require('../lib/restError');
var co       = require('co');
var MediaAPI = require('../lib/MediaAPI');

/* Schema */
var eventSchema = new Schema({
    date: { type: Date, required: true },

    show: {
        code: { type: String, default: '' },
        title: { type: String, default: '' }
    },
    episode: {
        code: { type: String, default: '' },
        title: { type: String, default: '' }
    },
    state: { type: String, default: 'sync' }
});

var eventTransform = (doc, event) => {
    var date = moment(event.date).utc();

    return {
        id: event._id,
        date: date.toISOString(),
        show: {
            code: event.show.code,
            title: event.show.title,
            description: {
                short: ''
            },
            image: {
                cover: ''
            }
        },
        episode: {
            code: event.episode.code,
            title: event.episode.title,
            description: '',
            image: ''
        },
        state: event.state
    }
};

if (!eventSchema.options.toJSON) eventSchema.options.toJSON = {};
eventSchema.options.toJSON.transform = eventTransform;
if (!eventSchema.options.toObject) eventSchema.options.toObject = {};
eventSchema.options.toObject.transform = eventTransform;

var Event = mongoose.model('Event', eventSchema);

/* Validation */
var validate = {
    id: id => mongoose.Types.ObjectId(id)
};

var validateData = (data) => {
    return new Promise((resolve, reject) => {
        let event = new Event(data);
        event.validate((error) => {
            if (error) {
               return reject(error);
            }

            resolve(event.toObject());
        });
    });
};

var validateParams = (params) => {
    let data = {};

    let date = moment();
    if (params.date && moment(params.date).isValid()) {
        date = moment(params.date);
    }
    data.date = date;

    let dateEnd = (params.dateEnd && moment(params.dateEnd).isValid()) ? moment(params.dateEnd) : date.clone().endOf('day');
    data.dateEnd = dateEnd;

    return data;
};

/* Sync */
var syncEvent = (event) => {
    if (!event.episode.code) {
        return;
    }

    MediaAPI.get(event.episode.code).then(
        (result) => {
            let data = {};
            if (result.error) {
                data = {
                    state: 'free'
                }
            } else {
                data = {
                    episode: {
                        code: result.code,
                        title: result.title
                    },
                    show: {
                        code: result.show.code,
                        title: result.show.title
                    },
                    state: 'linked'
                }
            }
            Model.update(event.id, data).then(
                (result) => {

                },
                (error) => {
                    debug(error);
                }
            );
        },
        (error) => {
            debug(error);
        }
    );
};

/**
 * Event Model
 *
 * @type {{get: Function, update: Function, remove: Function, collection: {get: Function, add: Function}}}
 */
var Model = {
    get: (id) => {
        try {
            /* Validation */
            var oid = validate.id(id);
        } catch (error) {
            return new Promise((resolve, reject) => {
                reject(new RestError({
                    message: 'Invalid ID',
                    status: 400,
                    code: 105,
                    parent: error
                }));
            });
        }

        return new Promise((resolve, reject) => {
            /* DB Query */
            Event.findById(oid).exec((error, event) => {

                if (error) {
                    return reject(error);
                }
                if (event) {
                    return resolve(event);
                }

                reject(new RestError({
                    message: 'Event not found',
                    status: 404,
                    code: 105
                }));

            });
        });
    },

    update: (id, data, options = { overwrite: false }) => {

        try {
            /* Validation */
            var oid = validate.id(id);
        } catch (error) {
            return new Promise((resolve, reject) => {
                reject(new RestError({
                    message: 'Invalid ID',
                    status: 400,
                    code: 105,
                    parent: error
                }));
            });
        }

        return co(function *() {
            if (options.overwrite) {
                data = yield validateData(data);
            }

            let updatePromise = new Promise((resolve, reject) => {
                Event.update({ _id: oid }, data, { overwrite: options.overwrite }, (error) => {
                    if (error) {
                        return reject(error);
                    }

                    Model.get(oid.toString()).then(
                        (event) => {
                            resolve(event);
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                });
            });

            let event = yield updatePromise;

            return event;
        });
    },

    remove: (id) => {

        try {
            /* Validation */
            var oid = validate.id(id);
        } catch (error) {
            return new Promise((resolve, reject) => {
                reject(new RestError({
                    message: 'Invalid ID',
                    status: 400,
                    code: 105,
                    parent: error
                }));
            });
        }

        return new Promise((resolve, reject) => {
            /* DB Query */
            Event.remove({_id: oid}).exec((error, event) => {
                if (error) {
                    return reject(error);
                }

                resolve();
            });
        });
    },

    collection: {
        get: (params) => {

            params = validateParams(params);

            return new Promise((resolve, reject) => {
                let query = Event
                    .find()
                    .where('date').gte(params.date).lte(params.dateEnd)
                    .sort('date')
                    .limit(100);

                query.exec((error, events) => {
                    if (error) {
                        return reject(new RestError({
                            message: 'Collection error',
                            status: 400,
                            code: 105,
                            parent: error
                        }));
                    }

                    resolve(events);
                });
            });
        },

        add: (data) => {
            var event = new Event(data);

            return new Promise((resolve, reject) => {
                event.save((error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    syncEvent(result);
                    resolve(result);
                })
            });
        },

        remove: (params) => {

            params = validateParams(params);

            return new Promise((resolve, reject) => {
                let query = Event
                    .remove()
                    .where('date').gte(params.date).lte(params.dateEnd);

                query.exec((error, result) => {
                    if (error) {
                        return reject(new RestError({
                            message: 'Collection delete error',
                            status: 400,
                            code: 105,
                            parent: error
                        }));
                    }

                    resolve(result);
                });
            });
        }
    }
};

module.exports = Model;