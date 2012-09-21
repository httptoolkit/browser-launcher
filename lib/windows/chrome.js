var exec = require('child_process').exec;
var qryVersion = 'reg query "HKEY_CURRENT_USER\\Software\\Google\\Update\\Clients" /s';
var qryPath = 'reg query "HKEY_CURRENT_USER\\Software\\Google\\Update" /v LastInstallerSuccessLaunchCmdLine';

exports.version = function(callback) {
   exec(qryVersion, function (err, stdout) {
	var data = stdout.split('\r\n'),
	version = '', inChrome;
   	data.forEach(function(line) {
	   if (inChrome && !version) {
	       if (/pv/.test(line)) {
	    	  version = line.replace('pv', '').replace('REG_SZ', '').trim();
	       }
	   }
	   if (/Google Chrome/.test(line)) {
	       inChrome = true;
	   }
	});
   	callback(null, version);
   });
};

exports.path = function(callback) {
   exec(qryPath, function (err, stdout) {
	var data = stdout.split('\r\n');
   	data.forEach(function(line) {
	    if (/LastInstallerSuccessLaunchCmdLine/.test(line)) {
	    	var cmd = line.replace('LastInstallerSuccessLaunchCmdLine', '').replace('REG_SZ', '').replace(/"/g, '').trim();
		if (cmd) {
   			callback(null, cmd);
		}
	    }
	});
   });
};

