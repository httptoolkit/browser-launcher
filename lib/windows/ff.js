var exec = require( 'child_process' ).exec,
	qryVersion = 'reg query "HKEY_CURRENT_USER\\Software\\Mozilla\\Mozilla Firefox" /v CurrentVersion',
	qryVersion2 = 'reg query "HKEY_LOCAL_MACHINE\\Software\\Mozilla\\Mozilla Firefox" /v CurrentVersion',
	qryPath = 'reg query "HKEY_CURRENT_USER\\Software\\Mozilla\\Mozilla Firefox\\" /s /v PathToExe',
	qryPath2 = 'reg query "HKEY_LOCAL_MACHINE\\Software\\Mozilla\\Mozilla Firefox\\%VERSION%\\Main\\" /s /v PathToExe',
	currentVersion;

exports.version = function( callback ) {
	if ( currentVersion ) {
		return callback( null, currentVersion );
	}

	exec( qryVersion, function( err, stdout ) {
		var data = stdout.split( '  ' ),
			version = data[ data.length - 1 ].replace( /\r\n/g, '' ).trim();

		if ( !version ) {
			exec( qryVersion2, function( err, stdout ) {
				var data = stdout.split( '  ' ),
					version = data[ data.length - 1 ]
					.replace( 'CurrentVersion', '' )
					.replace( 'REG_SZ', '' )
					.replace( /\r\n/g, '' )
					.trim();

				if ( version ) {
					currentVersion = version;
					callback( null, version );
				} else {
					callback( 'unable to determine firefox version' );
				}
			} );
		} else {
			if ( version ) {
				currentVersion = version;
				callback( null, version );
			} else {
				callback( 'unable to determine firefox version' );
			}
		}
	} );
};

exports.path = function( callback ) {
	exec( qryPath, function( err, stdout ) {
		var data = stdout.split( '\r\n' ),
			ffPath;

		data.forEach( function( line ) {
			var cmd;

			if ( /PathToExe/.test( line ) ) {
				cmd = line.replace( 'PathToExe', '' ).replace( 'REG_SZ', '' ).replace( /"/g, '' ).trim();
				if ( cmd ) {
					ffPath = cmd;
				}
			}
		} );

		if ( !ffPath ) {
			exports.version( function( err, version ) {
				if ( version ) {
					exec( qryPath2.replace( '%VERSION%', version ), function( err, stdout ) {
						var data = stdout.split( '\r\n' ),
							ffPath;

						data.forEach( function( line ) {
							var cmd;

							if ( /PathToExe/.test( line ) ) {
								cmd = line.replace( 'PathToExe', '' ).replace( 'REG_SZ', '' ).replace( /"/g, '' ).trim();
								if ( cmd ) {
									ffPath = cmd;
								}
							}
						} );

						if ( ffPath ) {
							callback( null, ffPath );
						} else {
							callback( 'unable to find firefox path' );
						}
					} );
				} else {
					callback( 'unable to find firefox path' );
				}
			} );
		} else {
			callback( null, ffPath );
		}
	} );
};
