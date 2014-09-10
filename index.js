var path = require( 'path' ),
	_ = require( 'lodash' ),
	configModule = require( './lib/config' ),
	detect = require( './lib/detect' ),
	run = require( './lib/run' ),
	createProfiles = require( './lib/create_profiles' );

module.exports = function( configFile, callback ) {
	if ( typeof configFile === 'function' ) {
		callback = configFile;
		configFile = null;
	}

	configModule.read( configFile, function( err, config, configDir ) {
		if ( !config ) {
			module.exports.update( configDir, function( err, config ) {
				if ( err ) {
					callback( err );
				} else {
					callback( null, wrap( config ) );
				}
			} );
		} else {
			callback( null, wrap( config ) );
		}
	} );

	function wrap( config ) {
		var res = launch.bind( null, config );

		res.browsers = config.browsers;

		return res;
	}

	function launch( config, uri, options, callback ) {
		if ( typeof options === 'string' ) {
			options = {
				browser: options
			};
		}

		options = options || {};

		var version = options.version || options.browser.split( '/' )[ 1 ] || '*',
			name = options.browser.toLowerCase().split( '/' )[ 0 ],
			runner = run( config, name, version );

		if ( !runner ) {
			return callback( 'no matches for ' + name + '/' + version );
		}

		runner( uri, options, callback );
	}
};

module.exports.detect = function( callback ) {
	detect( function( browsers ) {
		callback( browsers.map( function( browser ) {
			return _.pick( browser, [ 'name', 'version', 'type', 'command' ] );
		} ) );
	} );
};

module.exports.update = function( configDir, callback ) {
	if ( typeof configDir === 'function' ) {
		callback = configDir;
		configDir = path.dirname( configModule.defaultConfigFile );
	}

	detect( function( available ) {
		createProfiles( available, configDir, function( err ) {
			if ( err ) {
				return callback( err );
			}

			var config = {
				browsers: available
			};

			configModule.write( config, function( err ) {
				if ( err ) {
					callback( err );
				} else {
					callback( null, config );
				}
			} );
		} );
	} );
};

module.exports.config = configModule;
