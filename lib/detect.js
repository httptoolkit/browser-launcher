var spawn = require('child_process').spawn;
var browsers = {
    'google-chrome' : /Google Chrome (\S+)/,
    'chromium-browser' : /Chromium (\S+)/,
    'firefox' : /Mozilla Firefox (\S+)/,
};

module.exports = function (cb) {
    var available = {};
    var pending = Object.keys(browsers).length;
    
    Object.keys(browsers).forEach(function (browser) {
        check(browser, function (avail) {
            if (avail) available[browser] = avail;
            if (--pending === 0) cb(available);
        });
    });
};

function check (name, cb) {
    var re = browsers[name];
    
    var ps = spawn(name, [ '--version' ]);
    var data = '';
    ps.stdout.on('data', function (buf) { data += buf });
    
    ps.on('exit', function (code, sig) {
        if (code !== 0) return cb(null);
        
        var m = re.exec(data);
        if (m) cb(m[1])
        else cb(data.trim())
    });
};
