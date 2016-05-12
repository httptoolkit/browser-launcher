/**
 * Created by mitch on 2/29/16.
 */
var omit = require('lodash.omit');

var browsers = {
    chrome: {
        regex: /Google Chrome (\S+)/,
        profile: true,
        variants: {
            'chrome': ['google-chrome', 'google-chrome-stable'],
            'chrome-beta': ['google-chrome-beta'],
            'chrome-canary': ['google-chrome-canary']
        }
    },
    chromium: {
        regex: /Chromium (\S+)/,
        profile: true,
        variants: {
            'chromium': ['chromium', 'chromium-browser']
        }
    },
    firefox: {
        regex: /Mozilla Firefox (\S+)/,
        profile: true,
        variants: {
            'firefox': ['firefox'],
            'firefox-developer': ['firefox-developer']
        }
    },
    phantomjs: {
        regex: /(\S+)/,
        profile: false,
        headless: true
    },
    safari: {
        profile: false
    },
    ie: {
        profile: false
    },
    opera: {
        regex: /Opera (\S+)/,
        profile: true
    }
};

/**
 * Used to get browser information and configuration. By default, uses internal browser list
 * @param [browserList] list of browsers, configuration and variants
 * @constructor
 */
function Browsers(browserList) {
    this.browserList = browserList || browsers;
}

/**
 * Compiles each browser into the relevant data for Linux or Darwin. The structure of each object returned is:
 *  type: type of browser, e.g.: "chrome", "chromium", "ie"
 *  darwin: name of browser, used to look up "darwin detector" (see "./darwin" folder)
 *  linux: array of commands that the browser might run as on a 'nix environment
 *  regex: extracts version code when browser is run as a command
 *
 * @returns {Array}
 */
Browsers.prototype.browserPlatforms = function browserPlatforms() {
    var _browsers = [];
    var browsers = this.browserList;

    Object.keys(browsers).forEach(function(type) {
        var regex = browsers[type].regex;
        var variants = browsers[type].variants;

        if (!variants) {
            return _browsers.push({type: type, darwin: type, linux: [type], regex: regex});
        }

        Object.keys(variants).map(function(name) {
            return _browsers.push({type: type, darwin: name, linux: variants[name], regex: regex});
        });
    });

    return _browsers;
};

/**
 * Returns the configuration for the browser type specified
 * @param type type of browser
 * @returns {Object} config for the specified browser type
 */
Browsers.prototype.typeConfig = function typeConfig(type) {
    return omit(this.browserList[type], 'variants');
};

module.exports = Browsers;