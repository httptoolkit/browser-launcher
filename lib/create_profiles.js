var mkdirp = require( 'mkdirp' ),
	path = require( 'path' ),
	spawn = require( 'child_process' ).spawn;

module.exports = function( avail, configDir, cb ) {
	var pending = avail.length;

	if ( !pending ) {
		return cb();
	}

	function checkPending() {
		return !--pending && cb();
	}

	avail.forEach( function( br ) {
		if ( br.type === 'firefox' && br.profile ) {
			createFirefox( br.command, function( err, profile ) {
				if ( err ) {
					return cb( err );
				}

				br.profile = profile;

				checkPending();
			} );
		} else if ( br.profile ) {
			br.profile = makeDir( br.name, br.version );

			mkdirp( br.profile, function( err ) {
				if ( err ) {
					cb( err );
				} else {
					checkPending();
				}
			} );
		} else {
			checkPending();
		}
	} );

	function makeDir( name, version ) {
		var dir = name + '-' + version + '_' + Math.random().toString( 16 ).slice( 2 );

		return path.join( configDir, dir );
	}
};

function createFirefox( name, cb ) {
	var profileName = 'browser-launcher-' + Math.random().toString( 16 ).slice( 2 ),
		args = [ '--no-remote', '-CreateProfile', profileName ],
		ps = spawn( name, args ),
		data = '';

	ps.stdout.on( 'data', function( buf ) {
		data += buf;
	} );

	ps.stderr.on( 'data', function( buf ) {
		data += buf;
	} );

	ps.on( 'exit', function( code ) {
		if ( code !== 0 ) {
			return cb( name + ' ' + args.join( ' ' ) + ' exited with code ' + code + ': ' + data );
		}

		var match = data.match( /Success: created profile '[^']+' at '([^']+)/m );

		if ( !match ) {
			cb( 'Unexpected data: ' + data );
		} else {
			cb( null, {
				name: profileName,
				file: match[ 1 ]
			} );
		}
	} );
}
