var mkdirp = require( 'mkdirp' ),
	path = require( 'path' );

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
			checkPending();
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

function getRandom() {
	return Math.random().toString( 16 ).slice( 2 );
}
