var util = require( './util' ),
    SAFARI_ID = 'com.apple.Safari',
    SAFARI_VERSION_ID = 'CFBundleShortVersionString';

exports.path = util.find.bind(null, SAFARI_ID);
exports.version = util.getInfoKey.bind(null, SAFARI_ID, SAFARI_VERSION_ID);
