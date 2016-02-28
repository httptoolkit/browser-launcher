var spawn = require( 'child_process' ).spawn,
	winDetect = require( 'win-detect-browsers' ),
	darwin = require( './darwin' ),
	assign = require('lodash/assign'),
	omit = require('lodash/omit'),
	browsers = {
		chrome: {
			regex: /Google Chrome (\S+)/,
			profile: true,
			variants: {
				'chrome': ['google-chrome', 'google-chrome-stable'],
				'chrome-beta': ['google-chrome-beta'],
				'chrome-canary': ['google-chrome-canary']
			}
		},
		chromium: {
			regex: /Chromium (\S+)/,
			profile: true,
			variants: {
				'chromium': ['chromium', 'chromium-browser']
			}
		},
		firefox: {
			regex: /Mozilla Firefox (\S+)/,
			profile: true,
			variants: {
				'firefox': ['firefox'],
				'firefox-developer': ['firefox-developer']
			}
		},
		phantomjs: {
			regex: /(\S+)/,
			profile: false,
			headless: true
		},
		safari: {
			profile: false
		},
		ie: {
			profile: false
		},
		opera: {
			regex: /Opera (\S+)/,
			profile: true
		}
	};

/**
 * Detect all available browsers on Windows systems.
 * Pass an array of detected browsers to the callback function when done.
 * @param {Function} callback Callback function
 */
function detectWindows(callback) {
	winDetect(function (found) {
		var available = found.map(function (browser) {
			var br = omit(browsers[browser.name], 'variants');

			return assign({
				type: browser.name,
				name: browser.name,
				command: browser.path,
				version: browser.version
			}, br);
		});

		callback(available);
	});
}

/**
 * Check if the given browser is available (on OSX systems).
 * Pass its version and path to the callback function if found.
 * @param {String}   name     Name of a browser
 * @param {Function} callback Callback function
 */
function checkDarwin(name, callback) {
	if (darwin[name].all) {
		darwin[name].all(function (err, available) {
			if (err) {
				return callback('failed to get version for ' + name);
			}
			callback(null, available);
		});
		return;
	}

	darwin[name].version(function (err, version) {
		if (err) {
			return callback('failed to get version for ' + name);
		}

		darwin[name].path(function (err, path) {
			if (err) {
				return callback('failed to get path for ' + name);
			}

			callback(null, version, path);
		});
	});
}

/**
 * Check if the given browser is available (on Unix systems).
 * Pass its version to the callback function if found.
 * @param {String}   name     Name of a browser
 * @param {RegExp}	 regex	  Extracts version from command output
 * @param {Function} callback Callback function
 */
function checkOthers( name, regex, callback ) {
	var process = spawn( name, [ '--version' ] ),
		data = '';

	process.stdout.on( 'data', function( buf ) {
		data += buf;
	} );

	process.on( 'error', function() {
		callback( 'not installed' );
		callback = null;
	} );

	process.on( 'close', function( code ) {
		if ( !callback ) {
			return;
		}

		if ( code !== 0 ) {
			return callback( 'not installed' );
		}

		var match = regex.exec( data );
		var version = match ? match[1] : data.trim();
		callback(null, version);
	} );
}

function flattenBrowsers(shouldUseDarwinDetector) {
	var flatBrowsers = [];

	Object.keys(browsers).forEach(function(type) {
		var variants = browsers[type].variants;
		var config = omit(browsers[type], 'variants');

		if (!variants) {
			return flatBrowsers.push(assign({type: type, name: type, command: type}, config));
		}

		Object.keys(variants).map(function(name) {
			if (shouldUseDarwinDetector(name)) {
				return flatBrowsers.push(assign({type: type, name: name, command: command}, config));
			}

			return variants[name].map(function(command) {
				flatBrowsers.push(assign({type: type, name: name, command: command}, config));
			});
		});
	});

	return flatBrowsers;
}

/**
 * Detect all available web browsers.
 * Pass an array of available browsers to the callback function when done.
 * @param {Function} callback Callback function
 */
module.exports = function detect(callback) {
	if (process.platform === 'win32') {
		return detectWindows(callback);
	}

	function shouldUseDarwinDetector(browserName) {
		return process.platform === 'darwin' && darwin[browserName];
	}

	var available = [],
		detectAttempts = 0,
		flattened = flattenBrowsers(shouldUseDarwinDetector);
	flattened.forEach(function(flatBrowser) {
		function cb(err, version, path) {
			detectAttempts++;
			if (!err) {
				if (!Array.isArray(version)) {
					version = [{path: path, version: version}];
				}

				version.forEach(function(item) {
					available.push(assign({}, flatBrowser, {
						command: item.path || flatBrowser.command,
						version: item.version
					}));
				});
			}

			if (detectAttempts === flattened.length) {
				callback(available);
			}
		}

		if (shouldUseDarwinDetector(flatBrowser.name)) {
			return checkDarwin(flatBrowser.name, cb);
		}
		checkOthers(flatBrowser.command, flatBrowser.regex, cb);
	});
};
