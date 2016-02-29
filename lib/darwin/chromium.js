var util = require('./util'),
    CHROMIUM_ID = 'org.chromium.Chromium',
    CHROMIUM_VERSION = 'CFBundleShortVersionString';

exports.path = util.find.bind(null, CHROMIUM_ID);
exports.version = util.getInfoKey.bind(null, CHROMIUM_ID, CHROMIUM_VERSION);
