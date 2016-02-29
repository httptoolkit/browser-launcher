exports.safari = require( './safari' );
exports.firefox = require( './firefox' );
exports.chrome = exports[ 'google-chrome' ] = require( './chrome' );
exports.chromium = require( './chromium' );
exports.canary = exports[ 'chrome-canary' ] = exports[ 'google-chrome-canary' ] = require( './canary' );
exports.opera = require( './opera' );
