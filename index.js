var config = require('./lib/config');
var detect = require('./lib/detect');
var run = require('./lib/run');
var createProfiles = require('./lib/create_profiles');

var spawn = require('child_process').spawn;

exports = module.exports = function (opts, cb) {
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }
    if (!opts) opts = {};
    
    config.read(opts.config, function (err, cfg, configDir) {
        if (err) return cb(err);
        if (!cfg) {
            detect(function (avail) {
                createProfiles(avail, configDir, function (err) {
                    if (err) cb(err)
                    else write({ browsers : { local : avail } });
                })
            });
        }
        else cb(null, launcher.bind(null, cfg))
    });
    
    function write (cfg) {
        config.write(cfg, function (err) {
            if (err) cb(err)
            else cb(null, launcher.bind(null, cfg))
        })
    }
};
exports.detect = detect;
exports.config = config;

function launcher (cfg, uri, opts, cb) {
    if (typeof opts === 'string') {
        opts = { browser : opts };
    }
    if (!opts) opts = {};
    
    var version = opts.version || opts.browser.split('/')[1] || '*';
    var name = opts.browser.split('/')[0];
    
    var runner = run(cfg, name, version);
    if (!runner) return cb('no matches for ' + name + '/' + version);
    runner(uri, opts, cb);
}
