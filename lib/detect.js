var spawn = require('child_process').spawn;
var browsers = {
    'google-chrome' : {
        re : /Google Chrome (\S+)/,
        type : 'chrome',
        profile : true,
    },
    'chromium-browser' : {
        re : /Chromium (\S+)/,
        type : 'chrome',
        profile : true,
    },
    'firefox' : {
        re : /Mozilla Firefox (\S+)/,
        type : 'firefox',
        profile : true,
    },
    'phantomjs' : {
        type : 'chrome',
        re : /(\S+)/,
        headless : true
    },
};

module.exports = function (cb) {
    var available = {};
    var pending = Object.keys(browsers).length;
    
    Object.keys(browsers).forEach(function (name) {
        var br = browsers[name];
        check(name, function (v) {
            if (v) {
                available[name] = {
                    version : v,
                    headless : Boolean(br.headless),
                    profile : Boolean(br.profile),
                };
            }
            if (--pending === 0) cb(available);
        });
    });
};

function check (name, cb) {
    var re = browsers[name].re;
    
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
