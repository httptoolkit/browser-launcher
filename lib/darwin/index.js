var util = require('./util');

function browser(id, versionKey) {
    return {
        path: util.find.bind(null, id),
        version: util.getInfoKey.bind(null, id, versionKey)
    };
}

exports.chrome = browser('com.google.Chrome', 'KSVersion');
exports['chrome-canary'] = browser('com.google.Chrome.canary', 'KSVersion');
exports.chromium = browser('org.chromium.Chromium', 'CFBundleShortVersionString');
exports.firefox = browser('org.mozilla.firefox', 'CFBundleShortVersionString');
exports['firefox-developer'] = browser('org.mozilla.firefoxdeveloperedition', 'CFBundleShortVersionString');
exports['firefox-nightly'] = browser('org.mozilla.nightly', 'CFBundleShortVersionString');
exports.safari = browser('com.apple.Safari', 'CFBundleShortVersionString');
exports.opera = browser('com.operasoftware.Opera', 'CFBundleVersion');
exports.edge = browser('com.microsoft.edgemac', 'CFBundleVersion');
exports['edge-beta'] = browser('com.microsoft.edgemac.Beta', 'CFBundleVersion');
exports['edge-canary'] = browser('com.microsoft.edgemac.Canary', 'CFBundleVersion');
