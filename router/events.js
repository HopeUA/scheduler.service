'use strict';

var debug  = require('debug')('app');
var router = require('express').Router();
var Event  = require('../model/event');
var RestError = require('../lib/restError');
var co     = require('co');

/* Event Collection */
router.route('/')

    /* GET */
    .get((request, response, next) => {
        Event.collection.get(request.query).then(
            (events) => {
                let status = events.length ? 200 : 404;

                response.status(status);
                response.json({
                    data: events
                });
            },
            (error) => {
                next(error);
            }
        );
    })

    /* POST */
    .post((request, response, next) => {
        const user = request.user;
        if (user.actions.indexOf('scheduler.events.write') === -1) {
            return next(
                new RestError({
                    code: 403,
                    message: 'Unauthorized access'
                })
            );
        }

        Event.collection.add(request.body).then(
            (event) => {
                response.status(201);
                response.set('Location', '/v1/events/' + event.id);
                response.json(event);
            },
            (error) => {
                next(error);
            }
        );
    })

    /* DELETE */
    .delete((request, response, next) => {
        const user = request.user;
        if (user.actions.indexOf('scheduler.events.write') === -1) {
            return next(
                new RestError({
                    code: 403,
                    message: 'Unauthorized access'
                })
            );
        }

        // Delete only one day
        if (!request.query.date) {
            return next(new RestError({
                message: 'Date parameter is required',
                status: 403,
                code: 403
            }));
        }

        Event.collection.remove(request.query).then(
            () => {
                response.status(204);
                response.send();
            },
            (error) => {
                next(error);
            }
        );
    });

router.route('/count')
    .post((request, response, next) => {
        let dates = request.body.dates;
        if (!dates) {
            return next(new RestError({
                message: 'Dates parameter is required',
                status: 403,
                code: 403
            }));
        }

        co(function*(){
            let counts = yield dates.map((date) => {
                return Event.count(date);
            });

            let result = {};
            for (let count of counts) {
                result[count.date] = count.total;
            }

            response.status(200);
            response.json({dates: result});
        }).catch((error) => {
            next(error);
        });
    });

/* Event */
router.route('/:id')

    /* GET */
    .get((request, response, next) => {

        Event.get(request.params.id).then(
            (event) => {
                response.status(200);
                response.json(event);
            },
            (error) => {
                next(error);
            }
        );

    })

    /* PUT */
    .put((request, response, next) => {
        const user = request.user;
        if (user.actions.indexOf('scheduler.events.write') === -1) {
            return next(
                new RestError({
                    code: 403,
                    message: 'Unauthorized access'
                })
            );
        }

        Event.update(request.params.id, request.body, { overwrite: true }).then(
            (event) => {
                response.status(200);
                response.json(event);
            },
            (error) => {
                next(error);
            }
        );

    })

    /* PATCH */
    .patch((request, response, next) => {
        const user = request.user;
        if (user.actions.indexOf('scheduler.events.write') === -1) {
            return next(
                new RestError({
                    code: 403,
                    message: 'Unauthorized access'
                })
            );
        }

        Event.update(request.params.id, request.body, { overwrite: false }).then(
            (event) => {
                response.status(200);
                response.json(event);
            },
            (error) => {
                next(error);
            }
        );

    })

    /* DELETE */
    .delete(function(request, response, next){
        const user = request.user;
        if (user.actions.indexOf('scheduler.events.write') === -1) {
            return next(
                new RestError({
                    code: 403,
                    message: 'Unauthorized access'
                })
            );
        }

        Event.remove(request.params.id).then(
            () => {
                response.status(204);
                response.send();
            },
            (error) => {
                next(error);
            }
        );

    });

module.exports = router;
