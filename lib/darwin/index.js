var util = require('./util');

function browser(id, versionKey) {
    return {
        path: util.find.bind(null, id),
        version: util.getInfoKey.bind(null, id, versionKey)
    };
}

exports.safari = browser('com.apple.Safari', 'CFBundleShortVersionString');
exports.firefox = browser('org.mozilla.firefox', 'CFBundleShortVersionString');
exports.chrome = exports[ 'google-chrome' ] = browser('com.google.Chrome', 'KSVersion');
exports.chromium = browser('org.chromium.Chromium', 'CFBundleShortVersionString');
exports.canary = exports[ 'chrome-canary' ] = exports[ 'google-chrome-canary' ] = browser('com.google.Chrome.canary', 'KSVersion');
exports.opera = browser('com.operasoftware.Opera', 'CFBundleVersion');
