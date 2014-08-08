var path = require( 'path' ),
	config = require( './lib/config' ),
	detect = require( './lib/detect' ),
	run = require( './lib/run' ),
	_ = require( 'lodash' ),
	createProfiles = require( './lib/create_profiles' );

exports = module.exports = function( options, callback ) {
	if ( typeof options === 'function' ) {
		callback = options;
		options = {};
	}

	options = options || {};

	config.read( options.config, function( err, config, configDir ) {
		if ( !config ) {
			exports.setup( configDir, function( err, config ) {
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
		var res = launcher.bind( null, config );

		res.browsers = config.browsers;

		return res;
	}
};

exports.detect = function( callback ) {
	detect( function( browsers ) {
		callback( browsers.map( function( browser ) {
			return _.pick( browser, [ 'name', 'version', 'type', 'command' ] );
		} ) );
	} );
};

exports.setup = function( configDir, callback ) {
	if ( typeof configDir === 'function' ) {
		callback = configDir;
		configDir = path.dirname( config.defaultConfigFile );
	}

	detect( function( available ) {
		createProfiles( available, configDir, function( err ) {
			if ( err ) {
				return callback( err );
			}

			var config = {
				browsers: available
			};

			config.write( config, function( err ) {
				if ( err ) {
					callback( err );
				} else {
					callback( null, config );
				}
			} );
		} );
	} );
};

exports.config = config;

function launcher( config, uri, options, callback ) {
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
