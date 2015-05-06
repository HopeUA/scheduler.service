'use strict';

var debug  = require('debug')('app');
var router = require('express').Router();
var Event  = require('../model/event');
var RestError = require('../lib/restError');

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
