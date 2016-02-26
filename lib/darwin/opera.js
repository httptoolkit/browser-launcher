var util = require( './util' ),
    OPERA_ID = 'com.operasoftware.Opera',
    OPERA_VERSION = 'CFBundleVersion';

exports.path = util.find.bind(null, OPERA_ID);
exports.version = util.getInfoKey.bind(null, OPERA_ID, OPERA_VERSION);
