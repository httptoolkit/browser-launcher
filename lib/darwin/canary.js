var util = require( './util' ),
    CHROME_CANARY_ID = 'com.google.Chrome.canary',
    CHROME_CANARY_VERSION = 'KSVersion';

exports.path = util.find.bind(null, CHROME_CANARY_ID);
exports.version = util.getInfoKey.bind(null, CHROME_CANARY_ID, CHROME_CANARY_VERSION);
