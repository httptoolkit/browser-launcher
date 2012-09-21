var exec = require('child_process').exec;
var qryVersion = 'reg query "HKEY_CURRENT_USER\\Software\\Mozilla\\Mozilla Firefox" /v CurrentVersion';
var qryPath = 'reg query "HKEY_CURRENT_USER\\Software\\Mozilla\\Mozilla Firefox" /s /v PathToExe';


exports.version = function(callback) {
   exec(qryVersion, function (err, stdout) {
	var data = stdout.split('  '),
	version = data[data.length - 1].replace(/\r\n/g, '').trim();
   	callback(null, version);
   });
};

exports.path = function(callback) {
   exec(qryPath, function (err, stdout) {
	var data = stdout.split('\r\n');
   	data.forEach(function(line) {
	    if (/PathToExe/.test(line)) {
	    	var cmd = line.replace('PathToExe', '').replace('REG_SZ', '').replace(/"/g, '').trim();
		if (cmd) {
   			callback(null, cmd);
		}
	    }
	});
   });
};

