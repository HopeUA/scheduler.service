'use strict';

var expect    = require('chai').expect;
var RestError = require('../lib/restError');

describe('Rest Error', function() {
    it('should initialize', function() {
        let error = new RestError({
            message: 'Error message',
            code: 100
        });

        expect(error).to.be.an.instanceof(RestError);
        expect(error).to.be.an.instanceof(Error);

        expect(error.name).to.be.equal('RestError');
    });

    describe('#message', function() {
        it('should return message', function() {
            let error = new RestError({
                message: 'Error message',
                code: 100
            });

            expect(error.message).to.be.equal('Error message');
        });

        it('should return default message "Unexpected error"', function() {
            let error = new RestError();

            expect(error.message).to.be.equal('Unexpected error');
        });
    });

    describe('#code', function() {
        it('should return code', function() {
            let error = new RestError({
                message: 'Error message',
                code: 100
            });

            expect(error.code).to.be.equal(100);
        });

        it('should return default code = 500', function() {
            let error = new RestError({
                message: 'Error message'
            });

            expect(error.code).to.be.equal(500);
        });
    });

    describe('#status', function() {
        it('should return status', function() {
            let error = new RestError({
                message: 'Error message',
                code: 100,
                status: 200
            });

            expect(error.status).to.be.equal(200);
        });

        it('should return default status = 500', function() {
            let error = new RestError({
                message: 'Error message'
            });

            expect(error.status).to.be.equal(500);
        });
    });

    describe('#stack', function() {
        it('should return stack', function() {
            let error = new RestError({
                message: 'Error message'
            });

            expect(error.stack).to.match(/\/test\/restErrorSpec\.js:\d+:\d+/);
            expect(error.stack).to.string('RestError: Error message');
        })
    });

    describe('#parent', function() {
        it('shoult return parent Error', function(){
            let parentError = new Error('Parent error message');
            let error = new RestError({
                message: 'Error message',
                parent: parentError
            });

            expect(error.parent).to.be.equal(parentError);
        });
    });

    describe('#createFromError', function() {
        it('should be copied from Error', function() {
            let parentError = new Error('Error message');
            let error = RestError.createFromError(parentError);

            expect(error.message).to.be.equal(parentError.message);
            expect(error.stack).to.be.equal(parentError.stack);
        });

        it('should return default error', function() {
            let error = RestError.createFromError();

            expect(error).to.be.an.instanceof(RestError);
        })
    });
});