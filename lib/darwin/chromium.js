var util = require('./util'),
    currentPath;

function getPath(callback) {
    if (currentPath) {
        return callback(null, currentPath);
    }

    util.find('org.chromium.Chromium', function (err, path) {
        currentPath = path;
        callback(err, currentPath);
    });
}

function getVersion(callback) {
    getPath(function (err, path) {
        if (err) {
            return callback(err, null);
        }

        util.parse(util.getInfoPath(path), function (err, data) {
            callback(err, data.CFBundleShortVersionString);
        });
    });
}

exports.path = getPath;
exports.version = getVersion;
