var spawn = require( 'child_process' ).spawn,
	winDetect = require( 'win-detect-browsers' ),
	darwin = require( './darwin' ),
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
			name: 'phantom',
			re: /(\S+)/,
			type: 'phantom',
			headless: true,
			profile: true,
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
		},
		'opera': {
			name: 'opera',
			re: /Opera (\S+)/,
			type: 'opera',
			profile: true
		}
	},
	winDetectMap = {
		chrome: 'google-chrome',
		chromium: 'chromium-browser',
		ff: 'firefox',
		phantom: 'phantomjs',
		safari: 'safari',
		ie: 'ie'
	};

function mix( s, r ) {
	Object.keys( s ).forEach( function( name ) {
		if ( !r.hasOwnProperty( name ) ) {
			r[ name ] = s[ name ];
		}
	} );

	return r;
}

function checkWindows( cb ) {
	winDetect( function( found ) {
		var available = found.map( function( browser ) {
			var br = browsers[ winDetectMap[ browser.name ] ];

			return br ? mix( br, {
				command: browser.path,
				version: browser.version
			} ) : {
				name: browser.name,
				command: browser.path,
				version: browser.version
			};
		} );

		cb( available );
	} );
}

function checkDarwin( name, cb ) {
	if ( darwin[ name ] ) {
		if ( darwin[ name ].all ) {
			darwin[ name ].all( function( err, available ) {
				if ( err ) {
					cb( 'failed to get version for ' + name );
				} else {
					cb( err, available );
				}
			} );
		} else {
			darwin[ name ].version( function( err, version ) {
				if ( version ) {
					darwin[ name ].path( function( err, p ) {
						if ( err ) {
							return cb( 'failed to get path for ' + name );
						}

						cb( null, version, p );
					} );
				} else {
					cb( 'failed to get version for ' + name );
				}
			} );
		}
	} else {
		checkOthers( name, cb );
	}
}

function checkOthers( name, cb ) {
	console.log( 'check', name );
	var proc = spawn( name, [ '--version' ] ),
		re = browsers[ name ].re,
		data = '';

	proc.stdout.on( 'data', function( buf ) {
		data += buf;
	} );

	proc.on( 'error', function() {
		cb( 'not installed' );
		cb = null;
	} );

	proc.on( 'exit', function( code ) {
		if ( !cb ) {
			return;
		}

		if ( code !== 0 ) {
			return cb( 'not installed' );
		}

		console.log( 'data', name, data );

		var m = re.exec( data );

		if ( m ) {
			cb( null, m[ 1 ] );
		} else {
			cb( null, data.trim() );
		}
	} );
}

module.exports = function( cb ) {
	var available = [],
		pending = Object.keys( browsers ).length,
		check;

	if ( process.platform === 'win32' ) {
		return checkWindows( cb );
	} else if ( process.platform === 'darwin' ) {
		check = checkDarwin;
	} else {
		check = checkOthers;
	}

	Object.keys( browsers ).forEach( function( name ) {
		var br = browsers[ name ];

		check( name, function( err, v, p ) {
			if ( err === null ) {
				if ( Array.isArray( v ) ) {
					v.forEach( function( item ) {
						available.push( mix( br, {
							command: item.path,
							version: item.version
						} ) );
					} );
				} else {
					available.push( mix( br, {
						command: p || name,
						version: v
					} ) );
				}
			}

			if ( --pending === 0 ) {
				cb( available );
			}
		} );
	} );
};
