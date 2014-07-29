var plist = require( 'plist' ),
	path = require( 'path' ),
	util = require( './util' ),
	currentPath;

function getPath( callback ) {

	if ( currentPath ) {
		return callback( null, currentPath );
	}

	util.find( 'com.apple.Safari', function( err, p ) {
		currentPath = p;
		callback( err, currentPath );
	} );
}

function getVersion( callback ) {
	getPath( function( err, p ) {
		var pl = path.join( p, 'Contents', 'version.plist' );

		plist.parseFile( pl, function( err, data ) {
			callback( err, data[ 0 ].CFBundleShortVersionString );
		} );
	} );
}

exports.path = getPath;
exports.version = getVersion;
