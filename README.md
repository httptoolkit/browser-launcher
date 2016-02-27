# james-browser-launcher

[![Get it on npm](https://nodei.co/npm/james-browser-launcher.png?compact=true)](https://www.npmjs.org/package/james-browser-launcher)

Detect the browser versions available on your system and launch them in an
isolated profile for automated testing purposes.

You can launch browsers headlessly
(using [Xvfb](http://en.wikipedia.org/wiki/Xvfb) or with [PhantomJS](http://phantomjs.org/)) and set the proxy
configuration on the fly.

At the beginning of time, there was [substack/browser-launcher](https://github.com/substack/browser-launcher),
and all was well with the world. However, life happened, and the project became unmaintained.
Out of the ashes, a leader emerged, and promised the citizens of `npm` that `browser-launcher` would become great again,
but under a new banner: [`browser-launcher2`](https://github.com/benderjs/browser-launcher2).
The world was once again prosperous, until we were eventually notified that
[the king had forsaken us](https://github.com/benderjs/browser-launcher2/pull/45#issuecomment-147356133) (which
happens, it's open source, and `benderjs` did a lot for the community, which is awesome!)

Anyways, due to the project's dependence on `browser-launcher2`, `james-proxy` forked the project to make some
much-needed updates and fix some problems.

## Differences from *browser-launcher*

- contains fixes and pull requests for unresolved issues reported in original repository
- `launcher.browsers` is an array of local browsers only, not an object as it was before
- `launch` callback returns an `Instance` instead of a child process, see API section for more details
- uses [win-detect-browsers](https://github.com/vweevers/win-detect-browsers) for browser detection on Windows
- more browsers supported

## Differences from *browser-launcher2*

- This repository is not dead
- See [`CHANGELOG.md`](CHANGELOG.md)

## Supported browsers

The goal for this module is to support all major browsers on every desktop platform.

At the moment, `james-browser-launcher` supports following browsers on Windows, Unix and OS X:

- Chrome
- Chromium
- Firefox
- IE (Windows only)
- Opera
- Safari
- PhantomJS

## Install

```
npm install james-browser-launcher
```

## Example

### Browser launch
```js
var launcher = require( 'james-browser-launcher' );

launcher( function( err, launch ) {
	if ( err ) {
		return console.error( err );
	}

	launch( 'http://cksource.com/', 'chrome', function( err, instance ) {
		if ( err ) {
			return console.error( err );
		}

		console.log( 'Instance started with PID:', instance.pid );

		instance.on( 'stop', function( code ) {
			console.log( 'Instance stopped with exit code:', code );
		} );
	} );
} );
```

Outputs:

```
$ node example/launch.js
Instance started with PID: 12345
Instance stopped with exit code: 0
```

### Browser detection
```js
var launcher = require( '../' );

launcher.detect( function( available ) {
	console.log( 'Available browsers:' );
	console.dir( available );
} );
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
var launcher = require('james-browser-launcher');
launcher( function (err, launch) {
	launch( 'http://example.org/', {
		browser: 'chrome',
		detached: true
    }, function( err, instance ) {
		if ( err ) {
			return console.error( err );
		}

		instance.process.unref();
		instance.process.stdin.unref();
		instance.process.stdout.unref();
		instance.process.stderr.unref();
	} );
});
```

## API

``` js
var launcher = require('james-browser-launcher');
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
- *Array* `options.options` - additional command line options
- *String* `options.proxy` - URI of the proxy server
- *Boolean* `options.detached` - if true, then killing your script will not kill the opened browser
- *Boolean* `options.noProxy` - set proxy routes to skip over
- *Boolean* `options.headless` - run a browser in a headless mode (only if **Xvfb** available)
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

Updates the browsers cache file (`~/.config/james-browser-launcher/config.json` is no `configFile` was given) and creates new profiles for found browsers.

**Parameters:**
- *String* `configFile` - path to the configuration file *Optional*
- *Function* `callback(err, browsers)` - function called with found browsers and errors (if any)

## Known Issues

- IE8: after several starts and stops, if you manually open IE it will come up with a pop-up asking if we want to restore tabs (#21)
- Chrome @ OSX: it's not possible to launch multiple instances of Chrome at once

## License

MIT
