'use strict';

class RestError extends Error {

    constructor({message = 'Unexpected error', code = 500, status = 500, stack = '', parent = {}} = {}) {
        super();

        if (stack) {
            Object.defineProperty(this, 'stack', {
                value: stack
            });
        } else if (Error.hasOwnProperty('captureStackTrace')) {
            Error.captureStackTrace(this, this.constructor);
        }

        Object.defineProperty(this, 'code', {
            value: code
        });

        Object.defineProperty(this, 'status', {
            value: status
        });

        Object.defineProperty(this, 'message', {
            value: message
        });

        Object.defineProperty(this, 'parent', {
            value: parent
        });
    }

    get name() {
        return this.constructor.name;
    }

    static createFromError(error) {
        if (error instanceof Error) {
            return new RestError({
                message: error.message,
                stack: error.stack,
                parent: error
            })
        }

        return new RestError();
    }
}

module.exports = RestError;