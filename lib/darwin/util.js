var exec = require('child_process').exec,
    fs = require('fs'),
    path = require('path'),
    plist = require('plist');

exports.exists = fs.exists;
exports.parse = parse;
exports.find = find;
exports.getInfoPath = getInfoPath;
exports.getInfoKey = getInfoKey;

var infoCache = Object.create(null);
var bundleCache = Object.create(null);

function parse(file, callback) {
    if (infoCache[file]) {
        return callback(null, infoCache[file]);
    }

    fs.exists(file, function(exists) {
        if (!exists) {
            return callback('cannot parse non-existant plist', null);
        }

        fs.readFile(file, {
            encoding: 'utf8'
        }, function (err, data) {
            if (!err) {
                infoCache[file] = data = plist.parse(data);
            }

            callback(err, data);
        });
    });
}

function find(id, callback) {
    if (bundleCache[id]) {
        return callback(null, bundleCache[id]);
    }

    var pathQuery = 'mdfind kMDItemCFBundleIdentifier=="' + id + '" | head -1';
    exec(pathQuery, function (err, stdout) {
        var loc = stdout.trim();

        if (loc === '') {
            loc = null;
            err = 'not installed';
        } else {
            bundleCache[id] = loc;
        }

        callback(err, loc);
    });
}

function getInfoPath(p) {
    return path.join(p, 'Contents', 'Info.plist');
}

function getInfoKey(bundleId, key, callback) {
    find(bundleId, function (err, path) {
        if (err) {
            return callback(err, null);
        }

        parse(getInfoPath(path), function (err, data) {
            if (err) {
                return callback(err, null);
            }

            callback(null, data[key]);
        });
    });
}