import * as util from './util.js';

interface DarwinBrowser {
    path: (callback: (err: Error | string | null, path?: string) => void) => void;
    version: (callback: (err: Error | string | null, version?: string) => void) => void;
}

function browser(id: string, versionKey: string): DarwinBrowser {
    return {
        path: util.find.bind(null, id),
        version: util.getInfoKey.bind(null, id, versionKey)
    };
}

const darwinBrowsers: { [name: string]: DarwinBrowser } = {
    chrome: browser('com.google.Chrome', 'KSVersion'),
    'chrome-canary': browser('com.google.Chrome.canary', 'KSVersion'),
    'chrome-dev': browser('com.google.Chrome.dev', 'KSVersion'),
    'chrome-beta': browser('com.google.Chrome.beta', 'KSVersion'),
    chromium: browser('org.chromium.Chromium', 'CFBundleShortVersionString'),
    firefox: browser('org.mozilla.firefox', 'CFBundleShortVersionString'),
    'firefox-developer': browser('org.mozilla.firefoxdeveloperedition', 'CFBundleShortVersionString'),
    'firefox-nightly': browser('org.mozilla.nightly', 'CFBundleShortVersionString'),
    safari: browser('com.apple.Safari', 'CFBundleShortVersionString'),
    opera: browser('com.operasoftware.Opera', 'CFBundleVersion'),
    'opera-gx': browser('com.operasoftware.OperaGX', 'CFBundleVersion'),
    'opera-crypto': browser('com.operasoftware.OperaCrypto', 'CFBundleVersion'),
    msedge: browser('com.microsoft.edgemac', 'CFBundleVersion'),
    'msedge-beta': browser('com.microsoft.edgemac.Beta', 'CFBundleVersion'),
    'msedge-dev': browser('com.microsoft.edgemac.Dev', 'CFBundleVersion'),
    'msedge-canary': browser('com.microsoft.edgemac.Canary', 'CFBundleVersion'),
    brave: browser('com.brave.Browser', 'CFBundleVersion'),
    'brave-beta': browser('com.brave.Browser.beta', 'CFBundleVersion'),
    'brave-dev': browser('com.brave.Browser.dev', 'CFBundleVersion'),
    'brave-nightly': browser('com.brave.Browser.nightly', 'CFBundleVersion'),
    arc: browser('company.thebrowser.Browser', 'CFBundleVersion')
};

export { darwinBrowsers };
