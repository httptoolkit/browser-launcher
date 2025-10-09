import { spawn } from 'child_process';
import { darwinBrowsers } from './darwin/index.js';
import assign from 'lodash/assign.js';
import { Browsers } from './browsers.js';
import winDetect from 'win-detect-browsers';

const browsers = new Browsers();

interface DetectedBrowser {
    type: string;
    name: string;
    command: string;
    version: string;
    profile?: string | boolean;
    [key: string]: any;
}

/**
 * Detect all available browsers on Windows systems.
 * Returns an array of detected browsers.
 */
async function detectWindows(): Promise<DetectedBrowser[]> {
    return new Promise((resolve, reject) => {
        winDetect((error: Error | null, found: any[]) => {
            if (error) return reject(error);

            const available = found.map((browser) => {
                const config = browsers.typeConfig(browser.name);

                let configName: string;
                if (browser.channel && browser.channel !== "stable" && browser.channel !== "release") {
                    configName = `${browser.name}-${browser.channel}`;
                } else {
                    configName = browser.name;
                }

                return assign({
                    type: browser.name,
                    name: configName,
                    command: browser.path,
                    version: browser.version
                }, config);
            });

            resolve(available);
        });
    });
}

/**
 * Check if the given browser is available (on OSX systems).
 * Returns the version and path if found.
 */
async function checkDarwin(name: string): Promise<{ version: string; path: string }> {
    try {
        const version = await darwinBrowsers[name].version();
        const path = await darwinBrowsers[name].path();
        return { version, path };
    } catch (err) {
        throw new Error('failed to get version or path for ' + name);
    }
}

/**
 * Attempt to run browser (on Unix systems) to determine version.
 * Returns the version if found.
 */
async function getCommandVersion(name: string, regex: RegExp): Promise<string> {
    return new Promise((resolve, reject) => {
        let childProcess;
        try {
            childProcess = spawn(name, ['--version']);
        } catch (e) {
            reject(e as Error);
            return;
        }

        let data = '';

        childProcess.stdout.on('data', (buf) => {
            data += buf;
        });

        let resolved = false;
        childProcess.on('error', () => {
            if (!resolved) {
                resolved = true;
                reject(new Error('not installed'));
            }
        });

        childProcess.on('close', (code) => {
            if (resolved) {
                return;
            }

            if (code !== 0) {
                reject(new Error('not installed'));
                return;
            }

            const match = regex.exec(data);
            const version = match ? match[1] : data.trim();
            resolve(version);
        });
    });
}

/**
 * Check if the given browser is available (on Unix systems).
 * Returns the version and command if found.
 */
async function checkUnix(commands: string[], regex: RegExp): Promise<{ version: string; command: string }> {
    /*
         There could be multiple commands per browser on Linux. We try all of them and return
         the last successful match (to handle symlinking or multiple installation paths).
         */
    const results = await Promise.allSettled(
        commands.map(async (command) => ({
            version: await getCommandVersion(command, regex),
            command
        }))
    );

    // Find the last successful result
    for (let i = results.length - 1; i >= 0; i--) {
        if (results[i].status === 'fulfilled') {
            return (results[i] as PromiseFulfilledResult<{ version: string; command: string }>).value;
        }
    }

    throw new Error('Browser not found');
}

/**
 * Detect all available web browsers.
 * Returns an array of available browsers.
 */
async function detect(): Promise<DetectedBrowser[]> {
    if (process.platform === 'win32') {
        try {
            return await detectWindows();
        } catch {
            return [];
        }
    }

    const browserPlatforms = browsers.browserPlatforms();

    const results = await Promise.allSettled(
        browserPlatforms.map(async (browserPlatform) => {
            let version: string;
            let command: string;

            if (process.platform === 'darwin') {
                if (browserPlatform.darwin && darwinBrowsers[browserPlatform.darwin]) {
                    // If we have a darwin-specific bundle id to search for, use it:
                    const result = await checkDarwin(browserPlatform.darwin);
                    version = result.version;
                    command = result.path;
                } else if (browserPlatform.darwin && browserPlatform.linux) {
                    // If it's darwin-supported, but with no bundle id, search $PATH
                    // as we do on linux:
                    const result = await checkUnix(browserPlatform.linux, browserPlatform.regex!);
                    version = result.version;
                    command = result.command;
                } else {
                    throw new Error('Not supported');
                }
            } else if (browserPlatform.linux) {
                // On Linux, for supported browsers, we always just search $PATH:
                const result = await checkUnix(browserPlatform.linux, browserPlatform.regex!);
                version = result.version;
                command = result.command;
            } else {
                throw new Error('Not supported');
            }

            const config = browsers.typeConfig(browserPlatform.type);
            return assign({}, config, {
                type: browserPlatform.type,
                name: browserPlatform.darwin || browserPlatform.type,
                command: command,
                version: version
            }) as DetectedBrowser;
        })
    );

    return results
        .filter((result): result is PromiseFulfilledResult<DetectedBrowser> => result.status === 'fulfilled')
        .map(result => result.value);
}

export { detect };
