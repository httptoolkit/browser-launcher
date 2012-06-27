var mkdirp = require('mkdirp');
var path = require('path');

module.exports = function (avail, configDir, cb) {
    var pending = Object.keys(avail).length;
    if (pending === 0) cb();
    
    Object.keys(avail).forEach(function (name) {
        if (avail[name].profile) {
            var dir = avail[name].profile = makeDir(name, avail[name].version);
            mkdirp(dir, function (err) {
                if (err) return cb(err);
                if (--pending === 0) cb();
            });
        }
        else if (--pending === 0) cb()
    });
    
    function makeDir (name, v) {
        var d = name + '-' + v + '_' + Math.random().toString(16).slice(2);
        return path.join(configDir, d);
    }
};
