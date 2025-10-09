import * as fs from 'fs/promises';
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
 */
async function createProfiles(browsers: Browser[], configDir: string): Promise<void> {
    function dirName(name: string, version: string): string {
        const dir = name + '-' + version;
        return path.join(configDir, dir);
    }

    await Promise.all(browsers.map(async (browser) => {
        if (browser.type === 'firefox' && browser.profile) {
            // Firefox profiles are created differently
            return;
        } else if (browser.profile) {
            browser.profile = dirName(browser.name, browser.version);
            await fs.mkdir(browser.profile, { recursive: true });
        }
    }));
}

export { createProfiles };
