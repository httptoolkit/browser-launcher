# browser-launcher[![Build Status](https://github.com/httptoolkit/browser-launcher/workflows/CI/badge.svg)](https://github.com/httptoolkit/browser-launcher/actions) [![Get it on npm](https://img.shields.io/npm/v/@httptoolkit/browser-launcher.svg)](https://www.npmjs.com/package/@httptoolkit/browser-launcher)

> _Part of [HTTP Toolkit](https://httptoolkit.com): powerful tools for building, testing & debugging HTTP(S)_

Detect the browser versions available on your system and launch them in an isolated profile for automation & testing purposes.

You can launch browsers headlessly
(using [Xvfb](http://en.wikipedia.org/wiki/Xvfb) or with [PhantomJS](http://phantomjs.org/)) and set the proxy
configuration on the fly.

This project is the latest in a long series, each forked from the last:

* [substack/browser-launcher](https://github.com/substack/browser-launcher)
* [browser-launcher2](https://github.com/benderjs/browser-launcher2).
* [james-proxy/james-browser-launcher](https://github.com/james-proxy/james-browser-launcher)

Each previous versions seems to now be unmaintained, and this is a core component of [HTTP Toolkit](https://httptoolkit.com), so it's been forked here to ensure it can continue healthy into the future.

## Supported browsers

The goal for this module is to support all major browsers on every desktop platform.

At the moment, `browser-launcher` supports following browsers on Windows, Unix and OS X:

- Chrome
- Chromium
- Firefox
- IE (Windows only)
- Chromium-based Edge
- Brave
- Opera
- Safari (Mac only)
- PhantomJS
- Arc (experimental, Mac only)

## Setup

### Quick usage

```bash
> npx @httptoolkit/browser-launcher # Scans for browsers
[
    {
        "name": "chrome",
        "version": "...",
        # ...
    },
    # ...
]

> npx @httptoolkit/browser-launcher firefox # Launches a browser
firefox launched with PID: XXXXXX
```

If the package is already installed locally, you can use `browser-launcher` to launch it directly instead, either from the `node_modules/.bin` directly, or as binary name with `npx`.

### Install

```
npm install @httptoolkit/browser-launcher
```

## Example

### Browser launch

```js
const launcher = require('@httptoolkit/browser-launcher');

launcher(function(err, launch) {
	if (err) {
		return console.error(err);
	}

	launch('http://httptoolkit.com/', 'chrome', function(err, instance) {
		if (err) {
			return console.error(err);
		}

		console.log('Instance started with PID:', instance.pid);

		instance.on('stop', function(code) {
			console.log('Instance stopped with exit code:', code);
		});
	});
});
```

Outputs:

```
$ node example/launch.js
Instance started with PID: 12345
Instance stopped with exit code: 0
```

### Browser launch with options

```js
var launcher = require('@httptoolkit/browser-launcher');

launcher(function(err, launch) {
	// ...
	launch(
		'http://httptoolkit.com/',
		{
			browser: 'chrome',
			noProxy: [ '127.0.0.1', 'localhost' ],
			options: [
				'--disable-web-security',
				'--disable-extensions'
			]
		},
		function(err, instance) {
			// ...
		}
	);
});
```


### Browser detection
```js
var launcher = require('@httptoolkit/browser-launcher');

launcher.detect(function(available) {
	console.log('Available browsers:');
	console.dir(available);
});
```

Outputs:

```bash
$ node example/detect.js
Available browsers:
[ { name: 'chrome',
		version: '36.0.1985.125',
		type: 'chrome',
		command: 'google-chrome' },
	{ name: 'chromium',
		version: '36.0.1985.125',
		type: 'chrome',
		command: 'chromium-browser' },
	{ name: 'firefox',
		version: '31.0',
		type: 'firefox',
		command: 'firefox' },
	{ name: 'phantomjs',
		version: '1.9.7',
		type: 'phantom',
		command: 'phantomjs' },
	{ name: 'opera',
		version: '12.16',
		type: 'opera',
		command: 'opera' } ]
```

### Detaching the launched browser process from your script

If you want the opened browser to remain open after killing your script, first, you need to set `options.detached` to `true` (see the API). By default, killing your script will kill the opened browsers.

Then, if you want your script to immediately return control to the shell, you may additionally call `unref` on the `instance` object in the callback:

```js
var launcher = require('@httptoolkit/browser-launcher');
launcher(function (err, launch) {
	launch('http://example.org/', {
		browser: 'chrome',
		detached: true
    }, function(err, instance) {
		if (err) {
			return console.error(err);
		}

		instance.process.unref();
		instance.process.stdin.unref();
		instance.process.stdout.unref();
		instance.process.stderr.unref();
	});
});
```

## API

``` js
var launcher = require('@httptoolkit/browser-launcher');
```

### `launcher([configPath], callback)`

Detect available browsers and pass `launch` function to the callback.

**Parameters:**

- *String* `configPath` - path to a browser configuration file *(Optional)*
- *Function* `callback(err, launch)` - function called with `launch` function and errors (if any)

### `launch(uri, options, callback)`

Open given URI in a browser and return an instance of it.

**Parameters:**

- *String* `uri` - URI to open in a newly started browser
- *Object|String* `options` - configuration options or name of a browser to launch
- *String* `options.browser` - name of a browser to launch
- *String* `options.version` - version of a browser to launch, if none was given, the highest available version will be launched
- *String* `options.proxy` - URI of the proxy server
- *Array* `options.options` - additional command line options
- *Boolean* `options.skipDefaults` - don't supply any default options to browser
- *Boolean* `options.detached` - if true, then killing your script will not kill the opened browser
- *Array|String* `options.noProxy` - An array of strings, containing proxy routes to skip over
- *Boolean* `options.headless` - run a browser in a headless mode (only if **Xvfb** available)
- *String|null* `options.profile` - path to a directory to use for the browser profile, overriding the default. Null to force use of the default system profile (Chromium-based browsers only).
- *Function* `callback(err, instance)` - function fired when started a browser `instance` or an error occurred

### `launch.browsers`

This property contains an array of all known and available browsers.

### `instance`

Browser instance object.

**Properties:**
- *String* `command` - command used to start the instance
- *Array* `args` - array of command line arguments used while starting the instance
- *String* `image` - instance's image name
- *String* `processName` - instance's process name
- *Object* `process` - reference to instance's process started with Node's `child_process.spawn` API
- *Number* `pid` - instance's process PID
- *Stream* `stdout` - instance's process STDOUT stream
- *Stream* `stderr` - instance's process STDERR stream

**Events:**
- `stop` - fired when instance stops

**Methods:**
- `stop(callback)` - stop the instance and fire the callback once stopped

### `launcher.detect(callback)`

Detects all browsers available.

**Parameters:**
- *Function* `callback(available)` - function called with array of all recognized browsers

Each browser contains following properties:
- `name` - name of a browser
- `version` - browser's version
- `type` - type of a browser i.e. browser's family
- `command` - command used to launch a browser

### `launcher.update([configFile], callback)`

Updates the browsers cache file (`~/.config/browser-launcher/config.json` is no `configFile` was given) and creates new profiles for found browsers.

**Parameters:**
- *String* `configFile` - path to the configuration file *Optional*
- *Function* `callback(err, browsers)` - function called with found browsers and errors (if any)

## Known Issues

- IE8: after several starts and stops, if you manually open IE it will come up with a pop-up asking if we want to restore tabs (#21)
- Chrome @ OSX: it's not possible to launch multiple instances of Chrome at once

## License

MIT
