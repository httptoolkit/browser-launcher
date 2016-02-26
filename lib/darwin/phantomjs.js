var util = require( './util' );

exports.path = getPath = function( callback ) {
	util.findBin( 'phantomjs', function ( err, path ) {
		if ( err ) {
			callback( err, null );
		} else if ( path ) {
			callback( null, path );
		} else {
			callback( 'not installed' );
		}
	});
};

exports.version = getVersion = function ( callback ) {
	getPath( function( err, path ) {
		if ( err || !path ) {
			callback( err, null );
			return;
		}
		util.getBinVersion( 'phantomjs', function( err, version ) {
			if ( err || !version ) {
				callback( err, null );
			} else {
				callback( null, version );
			}
		});
	});
};
