var util = require( './util' ),
    CHROME_ID = 'com.google.Chrome',
    CHROME_VERSION = 'KSVersion';

exports.path = util.find.bind(null, CHROME_ID);
exports.version = util.getInfoKey.bind(null, CHROME_ID, CHROME_VERSION);
