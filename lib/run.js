var headless = require('headless');
var fs = require('fs');
var spawn = require('child_process').spawn;

var argue = {};
argue.firefox = function (uri, opts, cb) {
    var profile = '';
    if (opts.proxy) {
        var m = /^http:\/\/([^:\/]+)(:\d+)/.exec(opts.proxy);
        var host = JSON.stringify(m[1]);
        var port = m[2] || 80;
        profile += 'user_pref("network.proxy.http", ' + host + ');\n'
            + 'user_pref("network.proxy.http_port", ' + port + ');\n'
            + 'user_pref("network.proxy.type", 1);\n'
        ;
    }
    
    fs.writeFile(opts.profile.file, profile, function (err) {
        if (err) cb(err)
        else cb(null, [
            '-no-remote',
            '-P', opts.profile.name,
            uri,
        ].reduce(function (acc,x) { return acc.concat(x) }))
    });
};

argue.chrome = function (uri, opts, cb) {
    cb(null, [
        opts.proxy ? [ '--proxy-server', opts.proxy ] : [],
        opts.profile ? [ '--user-data-dir', opts.profile ] : [],
        uri,
    ].reduce(function (acc,x) { return acc.concat(x) }));
};

module.exports = function (config, name, version) {
    var m = selectMatch(config, name, version);
    if (!m) return;
    return function (uri, opts, cb) {
        if (opts.headless && m.headless) {
            headless(function (err, proc, display) {
                run({ DISPLAY : ':' + display });
            });
        }
        else run({})
        
        function run (env_) {
            var env = {};
            Object.keys(process.env).forEach(function (key) {
                env[key] = process.env[key];
            });
            Object.keys(env_).forEach(function (key) {
                env[key] = env_[key];
            });
            
            argue[m.type](uri, opts, function (err, args) {
                if (err) return cb(err)
                else cb(null, spawn(name, args, { env : env }))
            });
        }
    };
};

function selectMatch (config, name, version) {
    var order = (config.preference || []).concat(Object.keys(config.browsers));
    for (var i = 0; i < order.length; i++) {
        var bs = config.browsers[order[i]];
        var matching = Object.keys(bs)
            .filter(function (key) {
                return matches(bs[key].version, version);
            })
            .sort(function (a, b) {
                return bs[b].version - bs[a].version;
            })
        ;
        if (matching.length) return bs[matching[0]];
    }
}

function matches (version, pattern) {
    if (pattern === undefined || pattern === '*') return true;
    
    // todo: real semvers
    var vs = version.split('.');
    var ps = pattern.split('.');
    for (var i = 0; i < ps.length; i++) {
        if (ps[i] === 'x' || ps[i] === '*') continue;
        if (ps[i] !== vs[i]) return false;
    }
    return true;
}
