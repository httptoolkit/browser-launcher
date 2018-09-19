var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var plist = require('simple-plist');

var infoCache = Object.create(null);
var bundleCache = Object.create(null);

function parse(file, callback) {
  if (infoCache[file]) {
    return callback(null, infoCache[file]);
  }

  fs.exists(file, function (exists) {
    if (!exists) {
      return callback('cannot parse non-existant plist', null);
    }

    plist.readFile(file, function (err, data) {
      infoCache[file] = data;
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
  find(bundleId, function (findErr, bundlePath) {
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

exports.exists = fs.exists;
exports.parse = parse;
exports.find = find;
exports.getInfoPath = getInfoPath;
exports.getInfoKey = getInfoKey;
