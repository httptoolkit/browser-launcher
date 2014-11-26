var spawn = require( 'child_process' ).spawn,
	winDetect = require( 'win-detect-browsers' ),
	darwin = require( './darwin' ),
	extend = require( 'lodash' ).extend,
	browsers = {
		'google-chrome': {
			name: 'chrome',
			re: /Google Chrome (\S+)/,
			type: 'chrome',
			profile: true,
		},
		'chromium-browser': {
			name: 'chromium',
			re: /Chromium (\S+)/,
			type: 'chrome',
			profile: true,
		},
		'firefox': {
			name: 'firefox',
			re: /Mozilla Firefox (\S+)/,
			type: 'firefox',
			profile: true,
		},
		'phantomjs': {
			name: 'phantomjs',
			re: /(\S+)/,
			type: 'phantom',
			headless: true,
			profile: false,
		},
		'safari': {
			name: 'safari',
			type: 'safari',
			profile: false
		},
		'ie': {
			name: 'ie',
			type: 'ie',
			profile: false
		},
		'opera': {
			name: 'opera',
			re: /Opera (\S+)/,
			type: 'opera',
			image: 'opera.exe',
			profile: true
		}
	},
	winDetectMap = {
		chrome: 'google-chrome',
		chromium: 'chromium-browser',
		ff: 'firefox',
		phantom: 'phantomjs',
		safari: 'safari',
		ie: 'ie',
		opera: 'opera'
	};

function checkWindows( callback ) {
	winDetect( function( found ) {
		var available = found.map( function( browser ) {
			var br = browsers[ winDetectMap[ browser.name ] ];

			return extend( {}, {
				name: browser.name,
				command: browser.path,
				version: browser.version
			}, br || {} );
		} );

		callback( available );
	} );
}

function checkDarwin( name, callback ) {
	if ( darwin[ name ] ) {
		if ( darwin[ name ].all ) {
			darwin[ name ].all( function( err, available ) {
				if ( err ) {
					callback( 'failed to get version for ' + name );
				} else {
					callback( err, available );
				}
			} );
		} else {
			darwin[ name ].version( function( err, version ) {
				if ( version ) {
					darwin[ name ].path( function( err, p ) {
						if ( err ) {
							return callback( 'failed to get path for ' + name );
						}

						callback( null, version, p );
					} );
				} else {
					callback( 'failed to get version for ' + name );
				}
			} );
		}
	} else {
		checkOthers( name, callback );
	}
}

function checkOthers( name, callback ) {
	var process = spawn( name, [ '--version' ] ),
		re = browsers[ name ].re,
		data = '';

	process.stdout.on( 'data', function( buf ) {
		data += buf;
	} );

	process.on( 'error', function() {
		callback( 'not installed' );
		callback = null;
	} );

	process.on( 'exit', function( code ) {
		if ( !callback ) {
			return;
		}

		if ( code !== 0 ) {
			return callback( 'not installed' );
		}

		var m = re.exec( data );

		if ( m ) {
			callback( null, m[ 1 ] );
		} else {
			callback( null, data.trim() );
		}
	} );
}

module.exports = function( callback ) {
	var available = [],
		names,
		check;

	if ( process.platform === 'win32' ) {
		return checkWindows( callback );
	} else if ( process.platform === 'darwin' ) {
		check = checkDarwin;
	} else {
		check = checkOthers;
	}

	names = Object.keys( browsers );

	function next() {
		var name = names.shift();

		if ( !name ) {
			return callback( available );
		}

		var br = browsers[ name ];

		check( name, function( err, v, p ) {
			if ( err === null ) {
				if ( Array.isArray( v ) ) {
					v.forEach( function( item ) {
						available.push( extend( {}, br, {
							command: item.path,
							version: item.version
						} ) );
					} );
				} else {
					available.push( extend( {}, br, {
						command: p || name,
						version: v
					} ) );
				}
			}

			next();
		} );
	}

	next();
};
