var headless = require('headless');
var mkdirp = require('mkdirp');
var os = require('os');
var fs = require('fs');
var path = require('path');
var uid = require('uid');
var assign = require('lodash.assign');
var Instance = require('./instance');
var setups = {};

/**
 * Get the major section of a semver string
 * @param  {String} version Version string
 * @return {Number} major version
 */
function major(version) {
  return version.split('.')[0];
}

/**
 * Copy a file
 * @param {String}   src    Source pathn
 * @param {String}   dest   Destination path
 * @param {Function} callback Completion callback
 */
function copy(src, dest, callback) {
  var rs = fs.createReadStream(src);
  var ws = fs.createWriteStream(dest);
  var called = false;

  function done(err) {
    if (!called) {
      called = true;
      callback(err);
    }
  }

  rs.on('error', done);
  ws.on('error', done);
  ws.on('close', function () {
    done();
  });

  rs.pipe(ws);
}

/**
 * Check if the given version matches the pattern
 * @param  {String} version   Browser version string
 * @param  {String} [pattern] Expected version pattern
 * @return {Boolean} true if the provided version matches the expected pattern
 */
function matches(version, pattern) {
  if (pattern === undefined || pattern === '*') {
    return true;
  }

  var vs = version.split('.');
  var ps = pattern.split('.');

  for (var i = 0; i < ps.length; i++) {
    if (ps[i] === 'x' || ps[i] === '*') {
      continue;
    }

    if (ps[i] !== vs[i]) {
      return false;
    }
  }

  return true;
}

/**
 * In the given configuration find a browser matching specified name and version
 * @param  {Object} config  Configuration object
 * @param  {String} name  Browser name
 * @param  {String} version Browser version
 * @return {Object} browser that matches provided name and version
 */
function findMatch(config, name, version) {
  var matching = config.browsers.filter(function (b) {
    return b.name === name && matches(b.version, version);
  }).sort(function (a, b) {
    return major(b.version) - major(a.version);
  });

  if (matching.length) {
    return matching[0];
  }
}

function formatNoProxyStandard(options) {
  var value = options.noProxy || [];
  if (typeof value !== 'string') {
    value = value.join(',');
  }
  return value;
}

function formatNoProxyChrome(options) {
  var value = options.noProxy || [];
  if (typeof value !== 'string') {
    value = value.join(';');
  }
  return value;
}

/**
 * Setup procedure for Firefox browser:
 * - create a temporary directory
 * - create and write prefs.js file
 * - collect command line arguments necessary to launch the browser
 * @param  {Object}   browser  Browser object
 * @param  {Object}   options  Configuration options
 * @param  {Function} callback Callback function
 */
setups.firefox = function (browser, options, callback) {
  var id = uid(10);
  var tempDir = path.join(os.tmpdir(), 'james-browser-launcher' + id);
  var file = path.join(tempDir, 'prefs.js');
  var prefs = options.skipDefaults ? {} : {
    'browser.shell.checkDefaultBrowser': false,
    'browser.bookmarks.restore_default_bookmarks': false,
    'dom.disable_open_during_load': false,
    'dom.max_script_run_time': 0,
    'browser.cache.disk.capacity': 0,
    'browser.cache.disk.smart_size.enabled': false,
    'browser.cache.disk.smart_size.first_run': false,
    'browser.sessionstore.resume_from_crash': false,
    'browser.startup.page': 0
  };

  mkdirp.sync(tempDir);

  options.options = options.options || [];
  options.tempDir = tempDir;

  if (options.proxy) {
    var match = /^(?:http:\/\/)?([^:/]+)(?::(\d+))?/.exec(options.proxy);
    var host = JSON.stringify(match[1]);
    var port = match[2] || 80;

    assign(prefs, {
      'network.proxy.http': host,
      'network.proxy.http_port': +port,
      'network.proxy.type': 1,
      'network.proxy.no_proxies_on': '"' + formatNoProxyStandard(options) + '"'
    });
  }

  if (options.prefs) {
    assign(prefs, options.prefs);
  }

  prefs = Object.keys(prefs).map(function (name) {
    return 'user_pref("' + name + '", ' + prefs[name] + ');';
  }).join('\n');

  options.options = options.options.concat([
    '--no-remote',
    '-profile', tempDir
  ]);

  fs.writeFile(file, prefs, function (err) {
    if (err) {
      callback(err);
    } else {
      callback(null, options.options, []);
    }
  });
};

/**
 * Setup procedure for IE and Safari browsers:
 *  - just run callback, can't really set any options
 * @param  {Object}   browser  Browser object
 * @param  {Object}   options  Configuration options
 * @param  {Function} callback Callback function
 */
setups.safari = function (browser, options, callback) {
  callback(null, [], []);
};
setups.ie = setups.safari;

    /**
 * Setup procedure for Chrome browser:
 * - collect command line arguments necessary to launch the browser
 * @param  {Object}   browser  Browser object
 * @param  {Object}   options  Configuration options
 * @param  {Function} callback Callback function
 */
setups.chrome = function (browser, options, callback) {
  options.options = options.options || [];
  options.options.push(browser.profile ? '--user-data-dir=' + browser.profile : null);
  if (options.proxy) {
    options.options.push('--proxy-server=' + options.proxy);
  }

  var noProxy = formatNoProxyChrome(options);
  if (noProxy) {
    options.options.push('--proxy-bypass-list=' + noProxy);
  }

  var defaults = [
    '--disable-restore-session-state',
    '--no-default-browser-check',
    '--disable-popup-blocking',
    '--disable-translate',
    '--start-maximized',
    '--disable-default-apps',
    '--disable-sync',
    '--enable-fixed-layout',
    '--no-first-run',
    '--noerrdialogs'
  ];

  callback(null, options.options, defaults);
};
setups.chromium = setups.chrome;

/**
 * Setup procedure for PhantomJS:
 * - configure PhantomJS to open res/phantom.js script
 * @param  {Object}   browser  Browser object
 * @param  {Object}   options  Configuration options
 * @param  {Function} callback Callback function
 */
setups.phantomjs = function (browser, options, callback) {
  options.options = options.options || [];

  callback(null, options.options.concat([
    options.proxy ? '--proxy=' + options.proxy.replace(/^http:\/\//, '') : null,
    path.join(__dirname, '../res/phantom.js'),
    []
  ]));
};

/**
 * Setup procedure for Opera browser:
 * - copy the default preferences file depending on the Opera version
 *   (res/operaprefs.ini or res/Preferences) to the profile directory
 * - collect command line arguments necessary to launch the browser
 * @param  {Object}   browser  Browser object
 * @param  {Object}   options  Configuration options
 * @param  {Function} callback Callback function
 */
setups.opera = function (browser, options, callback) {
  var prefs = {
    old: 'operaprefs.ini',
    blink: 'Preferences'
  };
  var engine = {
    old: [
      '-nosession',
      '-nomail'
    ],
    // using the same rules as for chrome
    blink: [
      '--disable-restore-session-state',
      '--no-default-browser-check',
      '--disable-popup-blocking',
      '--disable-translate',
      '--start-maximized',
      '--disable-default-apps',
      '--disable-sync',
      '--enable-fixed-layout',
      '--no-first-run',
      '--noerrdialogs'
    ]
  };
  var generation = major(browser.version) >= 15 ? 'blink' : 'old';
  var prefFile = prefs[generation];
  var src = path.join(__dirname, '../res/' + prefFile);
  var dest = path.join(browser.profile, prefFile);

  options.options = options.options || [];
  if (generation === 'blink') {
    options.options.push(browser.profile ? '--user-data-dir=' + browser.profile : null);
  }

  copy(src, dest, function (err) {
    if (err) {
      callback(err);
    } else {
      callback(
        null,
        options.options,
        engine[generation]
      );
    }
  });
};

/**
 * Run a browser
 * @param  {Object} config  Configuration object
 * @param  {String} name  Browser name
 * @param  {String} version Browser version
 * @return {Function|undefined} function which runs a browser, or undefined if browser can't be located
 */
module.exports = function runBrowser(config, name, version) {
  var browser = findMatch(config, name, version);

  if (!browser) {
    return undefined;
  }

  return function (uri, options, callback) {
    function run(customEnv) {
      var env = {};
      var cwd = process.cwd();

      // copy environment variables
      Object.keys(process.env).forEach(function (key) {
        env[key] = process.env[key];
      });

      Object.keys(customEnv).forEach(function (key) {
        env[key] = customEnv[key];
      });

      // setup the browser
      setups[browser.type](browser, options, function (err, args, defaultArgs) {
        if (err) {
          return callback(err);
        }

        if (!options.skipDefaults) {
          args = args.concat(defaultArgs);
        }

        // pass proxy configuration to the new environment
        var noProxy = formatNoProxyStandard(options);
        if (noProxy && env.no_proxy === undefined) {
          env.no_proxy = noProxy;
        }

        if (options.proxy && env.http_proxy === undefined) {
          env.http_proxy = options.proxy;
        }

        if (options.proxy && env.HTTP_PROXY === undefined) {
          env.HTTP_PROXY = options.proxy;
        }

        // prepare the launch command for Windows systems
        if (process.platform === 'win32') {
          // ensure all the quotes are removed
          browser.command = browser.command.replace(/"/g, '');
          // change directory to the app's base (Chrome)
          cwd = path.dirname(browser.command);
        }

        // prepare the launch command for OSX systems
        if (process.platform === 'darwin' && browser.command.endsWith('.app')) {
          // use the binary paths under the hood

          // open --wait-apps --new --fresh -a /Path/To/Executable <url> --args <rest of app args>
          args.unshift(
              '--wait-apps',
              '--new',
              '--fresh',
              '-a',
              browser.command,
              uri,
              '--args'
          );

          browser.processName = browser.command;
          browser.command = 'open';
        } else {
          args.push(uri);
        }

        browser.tempDir = options.tempDir;

        try {
          callback(null, new Instance(assign({}, browser, {
            args: args.filter(Boolean),
            detached: options.detached,
            env: env,
            cwd: cwd
          })));
        } catch (e) {
          callback(e);
        }
      });
    }

    // run a regular browser in a "headless" mode
    if (options.headless && !browser.headless) {
      headless(function (err, proc, display) {
        if (err) {
          return callback(err);
        }

        run({
          DISPLAY: ':' + display
        });
      });
    } else {
      run({});
    }
  };
};
