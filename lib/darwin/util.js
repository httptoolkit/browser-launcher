var exec = require( 'child_process' ).exec,
	fs = require( 'fs' ),
	path = require( 'path' ),
	plist = require( 'plist' );

exports.exists = require( 'fs' ).exists;

exports.parse = function( file, callback ) {
	fs.readFile( file, {
		encoding: 'utf8'
	}, function( err, data ) {
		if ( !err ) {
			data = plist.parse( data );
		}

		callback( err, data );
	} );
};

exports.find = function( id, callback ) {
	var pathQuery = 'mdfind "kMDItemCFBundleIdentifier=="' + id + '"" | head -1';

	exec( pathQuery, function( err, stdout ) {
		var loc = stdout.trim();

		if ( loc === '' ) {
			loc = null;
			err = 'not installed';
		}

		callback( err, loc );
	} );
};

exports.findBin = function (id, callback) {
	exec("which " + id, function( err, path ) {
		callback( err, path ? path.trim() : path );
	});
}

exports.getBinVersion = function (id, callback) {
	exec(id + " --version", function( err, version ) {
		callback( err, version ? version.trim() : version );
	});
}

exports.getInfoPath = function( p ) {
	return path.join( p, 'Contents', 'Info.plist' );
};
