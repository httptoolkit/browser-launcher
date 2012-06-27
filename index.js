var config = require('./lib/config');
var detect = require('./lib/detect');
var selectBrowser = require('./lib/select');
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
                    else write({ local : avail });
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

function launcher (cfg, browser, opts) {
    if (typeof browser === 'object') {
        opts = browser;
        browser = opts.browser;
    }
    if (typeof opts === 'string') {
        uri = opts;
        opts = {};
    }
    if (!opts) opts = {};
    
    var version = opts.version || browser.split('/')[1];
    var name = browser.split('/')[0];
    var selected = selectBrowser(cfg, name, version);
    
    return function (uri, opts) {
        var cmd = selected(uri, {
            proxy : opts.proxy,
            headless : opts.headless,
        });
        return spawn(cmd[0], cmd.slice(1));
    };
}
