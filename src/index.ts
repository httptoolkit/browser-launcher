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

interface LaunchFunction {
    (uri: string, options: string | LaunchOptions): Promise<Instance>;
    browsers: any[];
}

/**
 * Check the configuration and prepare a launcher function.
 * If there's no config ready, detect available browsers first.
 * Returns a launcher function.
 */
async function getLauncher(configFile?: string): Promise<LaunchFunction> {
    const file = configFile || configModule.defaultConfigFile;

    const { data: config } = await configModule.read(file);
    const finalConfig = config || await safeConfigUpdate(file);

    function wrap(config: Config): LaunchFunction {
        const res = launch.bind(null, config, file) as LaunchFunction;
        res.browsers = config.browsers;
        return res;
    }

    async function launch(config: Config, configFile: string, uri: string, options: string | LaunchOptions): Promise<Instance> {
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
            const newConfig = await safeConfigUpdate(configFile);
            runner = runBrowser(newConfig, name, version);
            if (!runner) {
                throw new Error(name + ' is not installed in your system.');
            }
        }

        return await runner(uri, opts);
    }

    return wrap(finalConfig);
}

/**
 * Detect available browsers
 */
async function detectBrowsers(): Promise<Browser[]> {
    const browsers = await detect();
    return browsers.map((browser) => {
        return pick(browser, ['name', 'version', 'type', 'command']);
    }) as Browser[];
}

/**
 * Detect the available browsers and build appropriate profiles if necessary
 */
async function buildConfig(configDir: string): Promise<Config> {
    const browsers = await detect();
    await createProfiles(browsers as any, configDir);
    return { browsers };
}

async function safeConfigUpdate(configFile: string): Promise<Config> {
    // Detect browsers etc, and try to update the config file, but return the
    // detected config regardless of whether the config file actually works
    const config = await buildConfig(path.dirname(configFile));

    try {
        await configModule.write(configFile, config);
    } catch (err) {
        console.warn(err);
    }

    return config;
}

/**
 * Detect the available browsers and build appropriate profiles if necessary,
 * and update the config file with their details.
 */
async function updateBrowsers(configFile?: string): Promise<Config> {
    const file = configFile || configModule.defaultConfigFile;
    const config = await buildConfig(path.dirname(file));
    await configModule.write(file, config);
    return config;
}

export { getLauncher, detectBrowsers, updateBrowsers };
