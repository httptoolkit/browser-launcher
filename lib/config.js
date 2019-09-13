var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var packageJson = require('../package.json');
var osenv = require('osenv');
var defaultConfigFile = osenv.home() + '/.config/' + packageJson.name.split('/')[1] + '/config.json';

exports.defaultConfigFile = defaultConfigFile;

/**
 * Read a configuration file
 * @param {String}   [configFile] Path to the configuration file
 * @param {Function} callback     Callback function
 */
exports.read = function read(configFile, callback) {
    if (typeof configFile === 'function') {
        callback = configFile;
        configFile = defaultConfigFile;
    }

    if (!configFile) {
        configFile = defaultConfigFile;
    }

    var configDir = path.dirname(configFile);

    mkdirp(configDir, function (mkdirpErr) {
        if (mkdirpErr) {
            return callback(mkdirpErr);
        }

        fs.exists(configFile, function (exists) {
            if (exists) {
                fs.readFile(configFile, function (readErr, src) {
                    if (readErr) return callback(readErr);

                    let data;
                    try {
                        data = JSON.parse(src);
                    } catch (e) {
                        return callback(e);
                    }

                    callback(readErr, data, configDir);
                });
            } else {
                callback(mkdirpErr, null, configDir);
            }
        });
    });
};

/**
 * Write a configuration file
 * @param {String}   configFile Path to the configuration file
 * @param {Object}   config     Configuration object
 * @param {Function} callback   Callback function
 */
exports.write = function (configFile, config, callback) {
    callback = callback || function () {
    };

    if (typeof configFile === 'object') {
        callback = config;
        config = configFile;
        configFile = defaultConfigFile;
    }

    mkdirp(path.dirname(configFile), function (err) {
        if (err) {
            return callback(err);
        }

        fs.writeFile(configFile, JSON.stringify(config, null, 2), callback);
    });
};
