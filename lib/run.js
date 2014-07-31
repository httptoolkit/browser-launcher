var headless = require( 'headless' ),
	fs = require( 'fs' ),
	path = require( 'path' ),
	spawn = require( 'child_process' ).spawn,
	argue = {};

argue.firefox = function( br, uri, opts, cb ) {
	var prefs = '';

	opts.options = opts.options || [];

	if ( opts.proxy ) {
		var m = /^(?:http:\/\/)?([^:\/]+)(?::(\d+))?/.exec( opts.proxy ),
			host = JSON.stringify( m[ 1 ] ),
			port = m[ 2 ] || 80;

		prefs += [
			'"network.proxy.http", ' + host,
			'"network.proxy.http_port", ' + port,
			'"network.proxy.type", 1',
			'"browser.cache.disk.capacity", 0',
			'"browser.cache.disk.smart_size.enabled", false',
			'"browser.cache.disk.smart_size.first_run", false',
			'"browser.sessionstore.resume_from_crash", false',
			'"browser.startup.page", 0',
			'"network.proxy.no_proxies_on", ' + JSON.stringify( opts.noProxy || '' )
		].map( function( x ) {
			return 'user_pref(' + x + ');\n';
		} ).join( '' );
	}

	prefs += 'user_pref("browser.shell.checkDefaultBrowser", false);\n';

	var file = path.join( path.dirname( br.profile.file ), 'user.js' );

	fs.writeFile( file, prefs, function( err ) {
		if ( err ) {
			cb( err );
		} else {
			cb( null, opts.options.concat( [
				'--no-remote',
				'-P', br.profile.name,
				uri
			] ) );
		}
	} );
};

argue.ie = function( br, uri, opts, cb ) {
	cb( null, [ uri ] );
};

argue.safari = function( br, uri, opts, cb ) {
	cb( null, [ uri ] );
};

argue.chrome = function( br, uri, opts, cb ) {
	opts.options = opts.options || [];

	cb( null, opts.options.concat( [
		opts.proxy ? '--proxy-server=' + opts.proxy : null,
		br.profile ? '--user-data-dir=' + br.profile : null,
		'--disable-restore-session-state',
		'--no-default-browser-check',
		'--start-maximized',
		'--disable-default-apps',
		'--disable-sync',
		'--enable-fixed-layout',
		'--no-first-run',
		'--noerrdialogs ',
		uri
	] ).filter( Boolean ) );
};

argue.phantom = function( br, uri, opts, cb ) {
	var file = path.join( br.profile, 'phantom.js' ),
		src = 'require(\'webpage\').create().open(' + JSON.stringify( uri ) + ')';

	// `phantomjs uri` would be TOO EASY I guess?
	opts.options = opts.options || [];

	fs.writeFile( file, src, function( err ) {
		if ( err ) {
			cb( err );
		} else {
			cb( null, opts.options.concat( [
				opts.proxy ? '--proxy=' + opts.proxy.replace( /^http:\/\//, '' ) : null,
				file
			] ).filter( Boolean ) );
		}
	} );
};

function copy( src, dest, cb ) {
	var rs = fs.createReadStream( src ),
		ws = fs.createWriteStream( dest ),
		called = false;

	function done( err ) {
		if ( !called ) {
			called = true;
			cb( err );
		}
	}

	rs.on( 'error', done );
	ws.on( 'error', done );
	ws.on( 'close', function() {
		done();
	} );

	rs.pipe( ws );
}

argue.opera = function( br, uri, opts, cb ) {
	var src = path.join( __dirname, '../res/operaprefs.ini' ),
		dest = path.join( br.profile, 'operaprefs.ini' ),
		options = {
			old: [
				br.profile ? '-pd ' + br.profile : null,
				'-nomail',
				uri
			],
			blink: [
				br.profile ? '--user-data-dir=' + br.profile : null,
				'--disable-restore-session-state',
				'--no-default-browser-check',
				'--start-maximized',
				'--disable-default-apps',
				'--disable-sync',
				'--enable-fixed-layout',
				'--no-first-run',
				'--noerrdialogs ',
				uri
			]
		};

	opts.options = opts.options || [];

	copy( src, dest, function( err ) {
		if ( err ) {
			cb( err );
		} else {
			cb( null, opts.options.concat( options[ major( br.version ) > 15 ? 'blink' : 'old' ] ).filter( Boolean ) );
		}
	} );
};

module.exports = function( config, name, version ) {
	var m = selectMatch( config, name, version );

	if ( !m ) {
		return;
	}

	return function( uri, opts, cb ) {
		if ( opts.headless && !m.headless ) {
			headless( function( err, proc, display ) {
				if ( err ) {
					return cb( err );
				}

				run( {
					DISPLAY: ':' + display
				} );
			} );
		} else {
			run( {} );
		}

		function run( env_ ) {
			var env = {},
				cwd = process.cwd();

			Object.keys( process.env ).forEach( function( key ) {
				env[ key ] = process.env[ key ];
			} );

			Object.keys( env_ ).forEach( function( key ) {
				env[ key ] = env_[ key ];
			} );

			argue[ m.type ]( m, uri, opts, function( err, args ) {
				if ( err ) {
					return cb( err );
				}

				if ( opts.noProxy && env.no_proxy === undefined ) {
					env.no_proxy = opts.noProxy;
				}

				if ( opts.proxy && env.http_proxy === undefined ) {
					env.http_proxy = opts.proxy;
				}

				if ( opts.proxy && env.HTTP_PROXY === undefined ) {
					env.HTTP_PROXY = opts.proxy;
				}

				switch ( process.platform ) {
					case 'win32':
						m.command = m.command.replace( /"/g, '' ); //Ensure all the quotes are removed
						cwd = require( 'path' ).dirname( m.command ); //Change directory to the app's base (Chrome)
						break;
					case 'darwin':
						if ( m.name !== 'firefox' && m.name !== 'phantom' ) { //Use the bin path under the hood
							/*
                            This creates a command line structure like this:
                            open --wait-apps --new --fresh -a /Path/To/Executable <url> --args <rest of app args>
                            */
							args.unshift( '--args' );
							args.unshift( args.pop() );
							args.unshift( m.command );
							args.unshift( '-a' );
							args.unshift( '--fresh' );
							args.unshift( '--new' );
							args.unshift( '--wait-apps' );
							m.command = 'open';
						}
						break;
				}

				cb( null, spawn( m.command, args, {
					env: env,
					cwd: cwd
				} ) );
			} );
		}
	};
};

function major( version ) {
	return +version.split( '.' )[ 0 ];
}

function selectMatch( config, name, version ) {
	var order = ( config.preference || [] ).concat( Object.keys( config.browsers ) ),
		matching,
		bs,
		i;

	function filter( bs ) {
		return bs.filter( function( b ) {
			return b.name === name && matches( b.version, version );
		} ).sort( function( a, b ) {
			return major( b.version ) - major( a.version );
		} );
	}

	for ( i = 0; i < order.length; i++ ) {
		bs = config.browsers[ order[ i ] ];

		matching = filter( bs );

		if ( matching.length ) {
			return matching[ 0 ];
		}
	}
}

function matches( version, pattern ) {
	if ( pattern === undefined || pattern === '*' ) {
		return true;
	}

	// todo: real semvers
	var vs = version.split( '.' ),
		ps = pattern.split( '.' ),
		i;

	for ( i = 0; i < ps.length; i++ ) {
		if ( ps[ i ] === 'x' || ps[ i ] === '*' ) {
			continue;
		}

		if ( ps[ i ] !== vs[ i ] ) {
			return false;
		}
	}

	return true;
}
