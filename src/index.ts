import * as path from 'path';
import pick from 'lodash/pick.js';
import * as configModule from './config.js';
import { detect } from './detect.js';
import { runBrowser } from './run.js';
import { createProfiles } from './create_profiles.js';
import { Instance } from './instance.js';

interface Config {
    browsers: any[];
}

interface LaunchOptions {
    browser: string;
    version?: string;
    proxy?: string;
    options?: string[];
    skipDefaults?: boolean;
    detached?: boolean;
    noProxy?: string | string[];
    headless?: boolean;
    prefs?: { [key: string]: any };
    profile?: string | null;
}

interface Browser {
    name: string;
    version: string;
    type: string;
    command: string;
}

type LauncherCallback = (err: Error | string | null, launch?: LaunchFunction) => void;
type LaunchCallback = (err: Error | string | null, instance?: Instance) => void;

interface LaunchFunction {
    (uri: string, options: string | LaunchOptions, callback: LaunchCallback): void;
    browsers: any[];
}

/**
 * Check the configuration and prepare a launcher function.
 * If there's no config ready, detect available browsers first.
 * Finally, pass a launcher function to the callback.
 */
function getLauncher(callback: LauncherCallback): void;
function getLauncher(configFile: string, callback: LauncherCallback): void;
function getLauncher(configFileOrCallback: string | LauncherCallback, callback?: LauncherCallback): void {
    let configFile: string;
    let cb: LauncherCallback;

    if (typeof configFileOrCallback === 'function') {
        cb = configFileOrCallback;
        configFile = configModule.defaultConfigFile;
    } else {
        configFile = configFileOrCallback;
        cb = callback!;
    }

    configModule.read(configFile, (err, config) => {
        if (!config) {
            safeConfigUpdate(configFile, (err, config) => {
                if (err) {
                    cb(err);
                } else {
                    cb(null, wrap(config!));
                }
            });
        } else {
            cb(null, wrap(config));
        }
    });

    function wrap(config: Config): LaunchFunction {
        const res = launch.bind(null, config) as LaunchFunction;
        res.browsers = config.browsers;
        return res;
    }

    function launch(config: Config, uri: string, options: string | LaunchOptions, callback: LaunchCallback): void {
        let opts: LaunchOptions;

        if (typeof options === 'string') {
            opts = {
                browser: options
            };
        } else {
            opts = options || {} as LaunchOptions;
        }

        const version = opts.version || opts.browser.split('/')[1] || '*';
        const name = opts.browser.toLowerCase().split('/')[0];
        let runner = runBrowser(config, name, version);

        if (!runner) {
            // update the list of available browsers and retry
            safeConfigUpdate(configFile, (err, newConfig) => {
                runner = runBrowser(newConfig!, name, version);
                if (!runner) {
                    return callback(name + ' is not installed in your system.');
                }

                runner(uri, opts, callback);
            });
        } else {
            runner(uri, opts, callback);
        }
    }
}

/**
 * Detect available browsers
 */
getLauncher.detect = function (callback: (browsers: Browser[]) => void): void {
    detect((browsers) => {
        callback(browsers.map((browser) => {
            return pick(browser, ['name', 'version', 'type', 'command']);
        }));
    });
};

/**
 * Detect the available browsers and build appropriate profiles if necessary
 */
function buildConfig(configDir: string, callback: (err: Error | null, config?: Config) => void): void {
    detect((browsers) => {
        createProfiles(browsers as any, configDir, (err) => {
            if (err) {
                return callback(err);
            }

            callback(null, {
                browsers: browsers
            });
        });
    });
}

function safeConfigUpdate(configFile: string, callback: (err: Error | null, config?: Config) => void): void {
    // Detect browsers etc, and try to update the config file, but return the
    // detected config regardless of whether the config file actually works
    buildConfig(path.dirname(configFile), (err, config) => {
        if (err) {
            return callback(err);
        }

        configModule.write(configFile, config!, (err) => {
            if (err) {
                console.warn(err);
            }
            callback(null, config);
        });
    });
}

/**
 * Detect the available browsers and build appropriate profiles if necessary,
 * and update the config file with their details.
 */
getLauncher.update = function (configFileOrCallback: string | ((err: Error | null, config?: object) => void), callback?: (err: Error | null, config?: object) => void): void {
    let configFile: string;
    let cb: (err: Error | null, config?: object) => void;

    if (typeof configFileOrCallback === 'function') {
        cb = configFileOrCallback;
        configFile = configModule.defaultConfigFile;
    } else {
        configFile = configFileOrCallback;
        cb = callback!;
    }

    buildConfig(path.dirname(configFile), (err, config) => {
        if (err) {
            return cb(err);
        }

        configModule.write(configFile, config!, (err) => {
            if (err) {
                cb(err);
            } else {
                cb(null, config);
            }
        });
    });
};

export { getLauncher };
