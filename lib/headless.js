var headless = require('headless');
var hasXvfb = undefined;
var queue = [];

which('Xvfb', function (err) {
    hasXvfb = err ? false : true;
    queue.forEach(function (cb) {
        cb
    });
    queue = [];
});

module.exports = function () {
    
};
