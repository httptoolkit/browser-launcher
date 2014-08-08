var exec = require( 'child_process' ).exec,
	path = require( 'path' );

exports.exists = require( 'fs' ).exists;
exports.parse = require( 'plist' ).parseFile;

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

exports.getInfoPath = function( p ) {
	return path.join( p, 'Contents', 'Info.plist' );
};
