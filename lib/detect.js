var spawn = require('child_process').spawn;
var merge = require('merge');

var browsers = {
    'google-chrome' : {
        name : 'chrome',
        re : /Google Chrome (\S+)/,
        type : 'chrome',
        profile : true,
    },
    'chromium-browser' : {
        name : 'chromium',
        re : /Chromium (\S+)/,
        type : 'chrome',
        profile : true,
    },
    'firefox' : {
        name : 'firefox',
        re : /Mozilla Firefox (\S+)/,
        type : 'firefox',
        profile : true,
    },
    'phantomjs' : {
        name : 'phantom',
        re : /(\S+)/,
        type : 'phantom',
        headless : true,
        profile : true,
    },
    'safari': {
    	name: 'safari',
	type: 'safari',
	profile: false
    },
    'ie': {
	windows: true,
	name: 'ie',
	type: 'ie',
	profile: false
    }
};

module.exports = function (cb) {
    var available = [];
    var pending = Object.keys(browsers).length;
    console.log('BROWSERS');
    console.log(browsers);
    Object.keys(browsers).forEach(function (name) {
        var br = browsers[name];
	console.log('pre check ', br);
        check(name, function (v, p) {
            if (v) {
                available.push(merge(br, {
                    command : p || name,
                    version : v,
                }));
            }
            if (--pending === 0) cb(available);
        });
    });
};

var windows = require('./windows');
function checkWindows (name, cb) {
	console.log('check windows', name);
	if (windows[name]) {
	    console.log('getting version: ', name);
	    windows[name].version(function(err, version) {
		console.log('version for', name, version);
		if (version) {
		   windows[name].path(function(err, p) {
			console.log('version and path for', name, version, p);
		   	cb(version, p);
		   });
		} else {
		   cb(null);
		}
	    });
	} else {
   	    checkWhich(name, cb);
	}
};

function check(name, cb) {
   if (process.platform === 'win32') {
	checkWindows(name, cb);
   } else {
   	checkWhich(name, cb);
   }
};

function checkWhich (name, cb) {
    var re = browsers[name].re;
    if (browsers[name].windows) {
	 return cb(null);
    }
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
