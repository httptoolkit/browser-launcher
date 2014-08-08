var path = require( 'path' ),
	config = require( './lib/config' ),
	detect = require( './lib/detect' ),
	run = require( './lib/run' ),
	createProfiles = require( './lib/create_profiles' );

exports = module.exports = function( opts, cb ) {
	if ( typeof opts === 'function' ) {
		cb = opts;
		opts = {};
	}

	opts = opts || {};

	config.read( opts.config, function( err, cfg, configDir ) {
		if ( !cfg ) {
			exports.setup( configDir, function( err, cfg ) {
				if ( err ) {
					cb( err );
				} else {
					cb( null, wrap( cfg ) );
				}
			} );
		} else {
			cb( null, wrap( cfg ) );
		}
	} );

	function wrap( cfg ) {
		var res = launcher.bind( null, cfg );

		res.browsers = cfg.browsers;

		return res;
	}
};

exports.detect = detect;
exports.config = config;

exports.setup = function( configDir, cb ) {
	if ( typeof configDir === 'function' ) {
		cb = configDir;
		configDir = path.dirname( config.defaultConfigFile );
	}

	detect( function( available ) {
		createProfiles( available, configDir, function( err ) {
			if ( err ) {
				return cb( err );
			}

			var cfg = {
				browsers: available
			};

			config.write( cfg, function( err ) {
				if ( err ) {
					cb( err );
				} else {
					cb( null, cfg );
				}
			} );
		} );
	} );
};

function launcher( cfg, uri, opts, cb ) {
	if ( typeof opts === 'string' ) {
		opts = {
			browser: opts
		};
	}

	opts = opts || {};

	var version = opts.version || opts.browser.split( '/' )[ 1 ] || '*',
		name = opts.browser.toLowerCase().split( '/' )[ 0 ],
		runner = run( cfg, name, version );

	if ( !runner ) {
		return cb( 'no matches for ' + name + '/' + version );
	}

	runner( uri, opts, cb );
}
