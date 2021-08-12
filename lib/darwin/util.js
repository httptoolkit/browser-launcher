const fs = require('fs');
const path = require('path');
const plist = require('simple-plist');
const { findExecutableById } = require('@httptoolkit/osx-find-executable');

const infoCache = Object.create(null);

function parse(file, callback) {
    if (infoCache[file]) {
        return callback(null, infoCache[file]);
    }

    fs.exists(file, function (exists) {
        if (!exists) {
            return callback('cannot parse non-existent plist', null);
        }

        plist.readFile(file, function (err, data) {
            infoCache[file] = data;
            callback(err, data);
        });
    });
}

function findBundle(bundleId, callback) {
    findExecutableById(bundleId).then((execPath) => {
        callback(
            null,
            // Executable is always ${bundle}/Contents/MacOS/${execName},
            // so we just need to strip the last few levels:
            path.dirname(path.dirname(path.dirname(execPath)))
        );
    }).catch((err) => callback(err));
}

function getInfoPath(p) {
    return path.join(p, 'Contents', 'Info.plist');
}

function getInfoKey(bundleId, key, callback) {
    findBundle(bundleId, function (findErr, bundlePath) {
        if (findErr) {
            return callback(findErr, null);
        }

        parse(getInfoPath(bundlePath), function (infoErr, data) {
            if (infoErr) {
                return callback(infoErr, null);
            }

            callback(null, data[key]);
        });
    });
}

exports.find = findBundle;
exports.getInfoKey = getInfoKey;
