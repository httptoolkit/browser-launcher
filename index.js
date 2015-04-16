var path = require( 'path' ),
	_ = require( 'lodash' ),
	configModule = require( './lib/config' ),
	detect = require( './lib/detect' ),
	run = require( './lib/run' ),
	createProfiles = require( './lib/create_profiles' );

/**
 * Check the configuration and prepare a launcher function.
 * If there's no config ready, detect available browsers first.
 * Finally, pass a launcher function to the callback.
 * @param {String}   [configFile] Path to a configuration file
 * @param {Function} callback     Callback function
 */
module.exports = function getLauncher( configFile, callback ) {
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

/**
 * Detect available browsers
 * @param {Function} callback Callback function
 */
module.exports.detect = function( callback ) {
	detect( function( browsers ) {
		callback( browsers.map( function( browser ) {
			return _.pick( browser, [ 'name', 'version', 'type', 'command' ] );
		} ) );
	} );
};

/**
 * Update the browsers cache and create new profiles if necessary
 * @param {String}   configDir Path to the configuration file
 * @param {Function} callback  Callback function
 */
module.exports.update = function( configFile, callback ) {
	if ( typeof configFile === 'function' ) {
		callback = configFile;
		configFile = configModule.defaultConfigFile;
	}

	detect( function( browsers ) {
		createProfiles( browsers, path.dirname( configFile ), function( err ) {
			if ( err ) {
				return callback( err );
			}

			var config = {
				browsers: browsers
			};

			configModule.write( configFile, config, function( err ) {
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
