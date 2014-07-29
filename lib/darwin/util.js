var exec = require( 'child_process' ).exec,
	path = require( 'path' ),
	fs = require( 'fs' ),
	exists = fs.exists || path.exists;

exports.exists = exists;

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
