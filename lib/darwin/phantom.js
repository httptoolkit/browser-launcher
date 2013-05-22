
var exec = require('child_process').exec;
var currentPath;

var getPath = function(callback) {
    if (currentPath) {
        return callback(null, currentPath);
    }

    exec('which phantomjs', function(err, stdout, stderr) {
        if (err) return callback(err);
        currentPath = stdout.toString().replace(/\n/g, '');
        callback(null, currentPath);
    });
};

var getVersion = function(callback) {
    exec('phantomjs --version', function(err, stdout, stderr) {
        callback(err, stdout.replace(/\n/g, ''));
    });
};

exports.path = getPath;
exports.version = getVersion;
