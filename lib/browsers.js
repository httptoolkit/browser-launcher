/**
* Created by mitch on 2/29/16.
*/
var omit = require('lodash.omit');

var browserDefinitions = {
    chrome: {
        regex: /Google Chrome (\S+)/,
        profile: true,
        variants: {
            'chrome': ['google-chrome', 'google-chrome-stable'],
            'chrome-beta': ['google-chrome-beta'],
            'chrome-dev': ['google-chrome-unstable'],
            'chrome-canary': ['google-chrome-canary']
        }
    },
    chromium: {
        regex: /Chromium (\S+)/,
        profile: true,
        variants: {
            'chromium': ['chromium', 'chromium-browser'],
            'chromium-dev': ['chromium-dev']
        }
    },
    firefox: {
        regex: /Mozilla Firefox (\S+)/,
        profile: true,
        variants: {
            'firefox': ['firefox'],
            'firefox-developer': ['firefox-developer'],
            'firefox-nightly': ['firefox-nightly']
        }
    },
    phantomjs: {
        regex: /(\S+)/,
        profile: false,
        headless: true
    },
    safari: {
        profile: false,
        platforms: ['darwin']
    },
    ie: {
        profile: false,
        platforms: ['windows']
    },
    msedge: {
        regex: /Microsoft Edge (\S+)/,
        profile: true,
        variants: {
            'msedge': ['msedge', 'microsoft-edge'],
            'msedge-beta': ['msedge-beta', 'microsoft-edge-beta'],
            'msedge-dev': ['msedge-dev', 'microsoft-edge-dev'],
            'msedge-canary': ['msedge-canary', 'microsoft-edge-canary']
        }
    },
    brave: {
        regex: /Brave Browser (\S+)/,
        profile: true,
        variants: {
            'brave': ['brave-browser', 'brave', 'brave-browser-stable'],
            'brave-beta': ['brave-browser-beta', 'brave-beta'],
            'brave-dev': ['brave-browser-dev', 'brave-dev'],
            'brave-nightly': ['brave-browser-nightly', 'brave-nightly']
        }
    },
    opera: {
        regex: /Opera (\S+)/,
        profile: true
    },
    arc: {
        profile: false, // Arc overrides Chromium profile handling
        neverStartFresh: true, // Arc gets weird/crashy if you start fresh
        platforms: ['darwin']
    }
};

/**
* Used to get browser information and configuration. By default, uses internal browser list
* @param {Array} [browserList] list of browsers, configuration and variants
* @constructor
*/
function Browsers(browserList) {
    this.browserList = browserList || browserDefinitions;
}

/**
* Compiles each browser into the relevant data for Linux or Darwin. The structure of each object returned is:
*  type: type of browser, e.g.: "chrome", "chromium", "ie"
*  darwin: name of browser, used to look up "darwin detector" (see "./darwin" folder)
*  linux: array of commands that the browser might run as on a 'nix environment
*  regex: extracts version code when browser is run as a command
*
* @returns {Array} list of browser data
*/
Browsers.prototype.browserPlatforms = function browserPlatforms() {
    return Object.entries(this.browserList)
        .flatMap(([type, browserConfig]) => {
            const supportedOnDarwin = !browserConfig.platforms ||
                browserConfig.platforms.includes('darwin');
            const supportedOnLinux = !browserConfig.platforms ||
                browserConfig.platforms.includes('linux');
            // No windows check, since win-detect-browsers scans separately

            const variants = browserConfig.variants;

            if (!variants) {
                return [{
                    type: type,
                    ...(supportedOnDarwin ? { darwin: type } : {}),
                    ...(supportedOnLinux ? { linux: [type] } : {}),
                    regex: browserConfig.regex
                }];
            } else {
                return Object.keys(variants).map((name) => ({
                    type: type,
                    ...(supportedOnDarwin ? { darwin: name } : {}),
                    ...(supportedOnLinux ? { linux: variants[name] } : {}),
                    regex: browserConfig.regex
                }));
            }
        });
};

/**
* Returns the configuration for the browser type specified
* @param {String} type type of browser
* @returns {Object} config for the specified browser type
*/
Browsers.prototype.typeConfig = function typeConfig(type) {
    return omit(this.browserList[type], 'variants');
};

module.exports = Browsers;
