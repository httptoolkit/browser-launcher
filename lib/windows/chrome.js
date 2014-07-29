var exec = require( 'child_process' ).exec,
	path = require( 'path' ),
	defaultPath = '%HOMEPATH%\\Local Settings\\Application Data\\Google\\Chrome\\Application\\chrome.exe',
	qryVersion = 'reg query "HKEY_CURRENT_USER\\Software\\Google\\Update\\Clients" /s',
	qryPath = 'reg query "HKEY_CURRENT_USER\\Software\\Google\\Update" /v LastInstallerSuccessLaunchCmdLine',
	currentVersion;

function getDefaultPath( callback ) {
	exec( 'echo ' + defaultPath, function( err, stdout ) {
		callback( err, stdout.replace( /"/g, '' ).trim() );
	} );
}

exports.version = function( callback ) {
	if ( currentVersion ) {
		return callback( null, currentVersion );
	}

	exec( qryVersion, function( err, stdout ) {
		var data = stdout.split( '\r\n' ),
			version = '',
			inChrome;

		data.forEach( function( line ) {
			if ( inChrome && !version && /pv/.test( line ) ) {
				version = line.replace( 'pv', '' ).replace( 'REG_SZ', '' ).trim();
			}

			if ( /Google Chrome/.test( line ) ) {
				inChrome = true;
			}
		} );

		if ( version ) {
			currentVersion = version;
		}

		callback( null, version );
	} );
};

exports.path = function( callback ) {
	exports.version( function( err, version ) {
		exec( qryPath, function( err, stdout ) {
			var data = stdout.split( '\r\n' ),
				chromePath;

			data.forEach( function( line ) {
				var cmd;

				if ( /LastInstallerSuccessLaunchCmdLine/.test( line ) ) {
					cmd = line.replace( 'LastInstallerSuccessLaunchCmdLine', '' )
						.replace( 'REG_SZ', '' )
						.replace( /"/g, '' )
						.trim();

					if ( cmd ) {
						chromePath = cmd;
					}
				}
			} );

			if ( !chromePath && version ) {
				getDefaultPath( function( err, p ) {
					callback( null, p );
				} );
			} else {
				callback( null, chromePath );
			}
		} );
	} );
};
