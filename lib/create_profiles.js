var mkdirp = require( 'mkdirp' ),
	path = require( 'path' ),
	spawn = require( 'child_process' ).spawn;

module.exports = function( available, configDir, callback ) {
	var pending = available.length;

	if ( !pending ) {
		return callback();
	}

	function checkPending() {
		return !--pending && callback();
	}

	available.forEach( function( browser ) {
		if ( browser.type === 'firefox' && browser.profile ) {
			createFirefox( browser.command, function( err, profile ) {
				if ( err ) {
					return callback( err );
				}

				browser.profile = profile;

				checkPending();
			} );
		} else if ( browser.profile ) {
			browser.profile = makeDir( browser.name, browser.version );

			mkdirp( browser.profile, function( err ) {
				if ( err ) {
					callback( err );
				} else {
					checkPending();
				}
			} );
		} else {
			checkPending();
		}
	} );

	function makeDir( name, version ) {
		var dir = name + '-' + version + '_' + getRandom();

		return path.join( configDir, dir );
	}
};

function createFirefox( name, callback ) {
	var profileName = 'browser-launcher-' + getRandom(),
		args = [ '--no-remote', '-CreateProfile', profileName ],
		process = spawn( name, args ),
		data = '';

	process.stdout.on( 'data', function( buf ) {
		data += buf;
	} );

	process.stderr.on( 'data', function( buf ) {
		data += buf;
	} );

	process.on( 'exit', function( code ) {
		if ( code !== 0 ) {
			return callback( name + ' ' + args.join( ' ' ) + ' exited with code ' + code + ': ' + data );
		}

		var match = data.match( /Success: created profile '[^']+' at '([^']+)/m );

		if ( !match ) {
			callback( 'Unexpected data: ' + data );
		} else {
			callback( null, {
				name: profileName,
				file: match[ 1 ]
			} );
		}
	} );
}

function getRandom() {
	return Math.random().toString( 16 ).slice( 2 );
}
