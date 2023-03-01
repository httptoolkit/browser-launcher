var util = require('./util');

function browser(id, versionKey) {
    return {
        path: util.find.bind(null, id),
        version: util.getInfoKey.bind(null, id, versionKey)
    };
}

exports.chrome = browser('com.google.Chrome', 'KSVersion');
exports['chrome-canary'] = browser('com.google.Chrome.canary', 'KSVersion');
exports['chrome-dev'] = browser('com.google.Chrome.dev', 'KSVersion');
exports['chrome-beta'] = browser('com.google.Chrome.beta', 'KSVersion');
exports.chromium = browser('org.chromium.Chromium', 'CFBundleShortVersionString');
exports.firefox = browser('org.mozilla.firefox', 'CFBundleShortVersionString');
exports['firefox-developer'] = browser('org.mozilla.firefoxdeveloperedition', 'CFBundleShortVersionString');
exports['firefox-nightly'] = browser('org.mozilla.nightly', 'CFBundleShortVersionString');
exports.safari = browser('com.apple.Safari', 'CFBundleShortVersionString');
exports.opera = browser('com.operasoftware.Opera', 'CFBundleVersion');
exports.msedge = browser('com.microsoft.edgemac', 'CFBundleVersion');
exports['msedge-beta'] = browser('com.microsoft.edgemac.Beta', 'CFBundleVersion');
exports['msedge-dev'] = browser('com.microsoft.edgemac.Dev', 'CFBundleVersion');
exports['msedge-canary'] = browser('com.microsoft.edgemac.Canary', 'CFBundleVersion');
exports.brave = browser('com.brave.Browser', 'CFBundleVersion');
exports['brave-beta'] = browser('com.brave.Browser.beta', 'CFBundleVersion');
exports['brave-dev'] = browser('com.brave.Browser.dev', 'CFBundleVersion');
exports['brave-nightly'] = browser('com.brave.Browser.nightly', 'CFBundleVersion');
exports['arc'] = browser('company.thebrowser.Browser', 'CFBundleVersion')
