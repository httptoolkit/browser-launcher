var plist = require( 'plist' ),
	path = require( 'path' ),
	util = require( './util' ),
	exists = util.exists;

//Fetch all known version of Firefox on the host machine
exports.all = function( callback ) {
	var installed = [],
		pending = 0,
		check = function() {
			if ( !pending ) {
				callback( null, installed );
			}
		};

	util.find( 'org.mozilla.firefox', function( err, p ) {
		if ( p ) {
			var items = p.split( '\n' );
			pending = items.length;
			items.forEach( function( loc ) {
				var pl = path.join( loc, 'Contents', 'Info.plist' );
				exists( pl, function( y ) {
					if ( y ) {
						plist.parseFile( pl, function( err, data ) {
							var o = {
								version: data[ 0 ].CFBundleShortVersionString,
								path: path.join( loc, 'Contents/MacOS/firefox-bin' )
							};
							installed.push( o );
							pending--;
							check();
						} );
					} else {
						pending--;
						check();
					}
				} );
			} );
		} else {
			callback( 'not installed' );
		}
	} );
};
