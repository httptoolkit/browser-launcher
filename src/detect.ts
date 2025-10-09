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

type DetectCallback = (browsers: DetectedBrowser[]) => void;
type BrowserCheckCallback = (err: Error | string | null, version?: string, path?: string) => void;

/**
 * Detect all available browsers on Windows systems.
 * Pass an array of detected browsers to the callback function when done.
 */
function detectWindows(callback: (err: Error | null, browsers?: DetectedBrowser[]) => void): void {
    winDetect((error: Error | null, found: any[]) => {
        if (error) return callback(error);

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

        callback(null, available);
    });
}

/**
 * Check if the given browser is available (on OSX systems).
 * Pass its version and path to the callback function if found.
 */
function checkDarwin(name: string, callback: BrowserCheckCallback): void {
    darwinBrowsers[name].version((versionErr: Error | string | null, version?: string) => {
        if (versionErr) {
            return callback('failed to get version for ' + name);
        }

        darwinBrowsers[name].path((pathErr: Error | string | null, path?: string) => {
            if (pathErr) {
                return callback('failed to get path for ' + name);
            }

            callback(null, version, path);
        });
    });
}

/**
 * Attempt to run browser (on Unix systems) to determine version.
 * If found, the version is provided to the callback
 */
function getCommandVersion(name: string, regex: RegExp, callback: (err: Error | string | null, version?: string) => void): void {
    let childProcess;
    try {
        childProcess = spawn(name, ['--version']);
    } catch (e) {
        callback(e as Error);
        return;
    }

    let data = '';

    childProcess.stdout.on('data', (buf) => {
        data += buf;
    });

    let callbackCalled = false;
    childProcess.on('error', () => {
        if (!callbackCalled) {
            callbackCalled = true;
            callback('not installed');
        }
    });

    childProcess.on('close', (code) => {
        if (callbackCalled) {
            return;
        }

        if (code !== 0) {
            return callback('not installed');
        }

        const match = regex.exec(data);
        const version = match ? match[1] : data.trim();
        callback(null, version);
    });
}

/**
 * Check if the given browser is available (on Unix systems).
 * Pass its version and command to the callback function if found.
 */
function checkUnix(commands: string[], regex: RegExp, callback: BrowserCheckCallback): void {
    let checkCount = 0;
    let detectedVersion: string | undefined;

    commands.forEach((command) => {
        /*
             There could be multiple commands run per browser on Linux, and we can't call the callback on _every_
             successful command invocation, because then it will be called more than `browserPlatforms.length` times.

             This callback function performs debouncing, and also takes care of the case when the same browser matches
             multiple commands (due to symlinking or whatnot). Only the last _successful_ "check" will be saved and
             passed on
             */
        getCommandVersion(command, regex, (err, version) => {
            checkCount++;
            if (!err) {
                detectedVersion = version;
            }

            if (checkCount === commands.length) {
                callback(!detectedVersion ? 'Browser not found' : null, detectedVersion, command);
            }
        });
    });
}

/**
 * Detect all available web browsers.
 * Pass an array of available browsers to the callback function when done.
 */
function detect(callback: DetectCallback): void {
    if (process.platform === 'win32') {
        detectWindows((err, foundBrowsers) => {
            if (err) callback([]);
            else callback(foundBrowsers!);
        });
        return;
    }

    const available: DetectedBrowser[] = [];
    let detectAttempts = 0;
    const browserPlatforms = browsers.browserPlatforms();

    browserPlatforms.forEach((browserPlatform) => {
        function browserDone(err: Error | string | null, version?: string, path?: string) {
            detectAttempts++;
            if (!err && version && path) {
                const config = browsers.typeConfig(browserPlatform.type);
                available.push(assign({}, config, {
                    type: browserPlatform.type,
                    name: browserPlatform.darwin || browserPlatform.type,
                    command: path,
                    version: version
                }) as DetectedBrowser);
            }

            if (detectAttempts === browserPlatforms.length) {
                callback(available);
            }
        }

        if (process.platform === 'darwin') {
            if (browserPlatform.darwin && darwinBrowsers[browserPlatform.darwin]) {
                // If we have a darwin-specific bundle id to search for, use it:
                checkDarwin(browserPlatform.darwin, browserDone);
            } else if (browserPlatform.darwin && browserPlatform.linux) {
                // If it's darwin-supported, but with no bundle id, search $PATH
                // as we do on linux:
                checkUnix(browserPlatform.linux, browserPlatform.regex!, browserDone);
            } else {
                browserDone(new Error('Not supported') as any);
            }
        } else if (browserPlatform.linux) {
            // On Linux, for supported browsers, we always just search $PATH:
            checkUnix(browserPlatform.linux, browserPlatform.regex!, browserDone);
        } else {
            browserDone(new Error('Not supported') as any);
        }
    });
}

export { detect };
