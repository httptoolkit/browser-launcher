var which = require('which');
var mkdirp = require('mkdirp');
var detect = require('./detect');

var fs = require('fs');
var path = require('path');

module.exports = function (configFile, cb) {
    if (typeof configFile === 'function') {
        cb = configFile;
        configFile = (process.env.HOME || process.env.USERDIR)
            + '/.config/browser-launcher.json'
        ;
    }
    var configDir = path.dirname(configFile);
    
    mkdirp(configDir, function (err) {
        if (err) return cb(err);
        (fs.exists || path.exists)(configFile, function (ex) {
            if (ex) {
                fs.readFile(configFile, function (err, src) {
                    cb(null, JSON.parse(src));
                })
            }
            else cb(null, {});
        });
    });
};
