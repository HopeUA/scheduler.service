var debug    = require('debug')('app');

module.exports = {
    info: function(module, message) {
        this.message(module, message, 'INFO');
    },
    error: function(module, message) {
        this.message(module, message, 'ERROR');
    },
    message: function(module, message, type) {
        let str = '['+module+'] ' + type + ' ' + message;
        debug(str);
    }
};

