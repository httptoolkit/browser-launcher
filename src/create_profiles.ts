import * as fs from 'fs';
import * as path from 'path';

interface Browser {
    type: string;
    name: string;
    version: string;
    profile: string | boolean;
}

/**
 * Create profiles for the given browsers
 * @param browsers Array of browsers
 * @param configDir Path to a directory, where the profiles should be put
 * @param callback Callback function
 */
function createProfiles(browsers: Browser[], configDir: string, callback: (err?: Error | null) => void): void {
    let pending = browsers.length;

    if (!pending) {
        callback();
        return;
    }

    function checkPending() {
        return !--pending && callback();
    }

    function dirName(name: string, version: string): string {
        const dir = name + '-' + version;
        return path.join(configDir, dir);
    }

    browsers.forEach((browser) => {
        if (browser.type === 'firefox' && browser.profile) {
            checkPending();
        } else if (browser.profile) {
            browser.profile = dirName(browser.name, browser.version);

            fs.mkdir(browser.profile, { recursive: true }, (err) => {
                if (err) {
                    callback(err);
                } else {
                    checkPending();
                }
            });
        } else {
            checkPending();
        }
    });
}

export { createProfiles };
