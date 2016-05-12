var spawn = require('child_process').spawn,
    winDetect = require('win-detect-browsers'),
    darwin = require('./darwin'),
    assign = require('lodash.assign'),
    Browsers = require('./browsers'),
    browsers = new Browsers();

/**
 * Detect all available browsers on Windows systems.
 * Pass an array of detected browsers to the callback function when done.
 * @param {Function} callback Callback function
 */
function detectWindows(callback) {
    winDetect(function (found) {
        var available = found.map(function (browser) {
            var config = browsers.typeConfig(browser.name);

            return assign({
                type: browser.name,
                name: browser.name,
                command: browser.path,
                version: browser.version
            }, config);
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
 * Attempt to run browser (on Unix systems).
 * Pass its version to the callback function if found.
 * @param {String}   name     Name of a browser
 * @param {RegExp}     regex      Extracts version from command output
 * @param {Function} callback Callback function
 */
function getCommandVersion(name, regex, callback) {
    var process = spawn(name, ['--version']),
        data = '';

    process.stdout.on('data', function (buf) {
        data += buf;
    });

    process.on('error', function () {
        callback('not installed');
        callback = null;
    });

    process.on('close', function (code) {
        if (!callback) {
            return;
        }

        if (code !== 0) {
            return callback('not installed');
        }

        var match = regex.exec(data);
        var version = match ? match[1] : data.trim();
        callback(null, version);
    });
}

/**
 * Check if the given browser is available (on Unix systems).
 * Pass its version and command to the callback function if found.
 * @param {Array}    commands List of potential commands used to start browser
 * @param {RegExp}     regex extracts version from browser's command-line output
 * @param {Function} callback Callback function
 */
function checkUnix(commands, regex, callback) {
    var checkCount = 0;
    var detectedVersion;

    commands.forEach(function (command) {

        /*
         There could be multiple commands run per browser on Linux, and we can't call the callback on _every_
         successful command invocation, because then it will be called more than `browserPlatforms.length` times.

         This callback function performs debouncing, and also takes care of the case when the same browser matches
         multiple commands (due to symlinking or whatnot). Only the last _successful_ "check" will be saved and
         passed on
         */
        getCommandVersion(command, regex, function linuxDone(err, version) {
            checkCount++;
            if (!err) {
                detectedVersion = version;
            }

            if (checkCount == commands.length) {
                callback(!detectedVersion ? 'Browser not found' : null, detectedVersion, command);
            }
        });
    });
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

    var available = [],
        detectAttempts = 0,
        browserPlatforms = browsers.browserPlatforms();

    browserPlatforms.forEach(function (browserPlatform) {
        function browserDone(err, version, path) {
            detectAttempts++;
            if (!err) {
                var config = browsers.typeConfig(browserPlatform.type);
                available.push(assign({}, config, {
                    type: browserPlatform.type,
                    name: browserPlatform.darwin,
                    command: path,
                    version: version
                }));
            }

            if (detectAttempts === browserPlatforms.length) {
                callback(available);
            }
        }

        if (process.platform === 'darwin' && darwin[browserPlatform.darwin]) {
            checkDarwin(browserPlatform.darwin, browserDone);
            return;
        }

        checkUnix(browserPlatform.linux, browserPlatform.regex, browserDone);
    });
};
