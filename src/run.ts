import * as os from 'os';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import assign from 'lodash/assign.js';
import { Instance } from './instance.js';
import headless from 'headless';

interface Browser {
    type: string;
    name: string;
    version: string;
    command: string;
    profile: string | boolean;
    processName?: string;
    tempDir?: string;
    neverStartFresh?: boolean;
    [key: string]: any;
}

interface Config {
    browsers: Browser[];
}

interface LaunchOptions {
    browser?: string;
    version?: string;
    proxy?: string;
    options?: string[];
    skipDefaults?: boolean;
    detached?: boolean;
    noProxy?: string | string[];
    headless?: boolean;
    prefs?: { [key: string]: any };
    profile?: string | null;
    tempDir?: string;
}

type SetupResult = { args: string[]; defaultArgs: string[] };
type BrowserRunner = (uri: string, options: LaunchOptions) => Promise<Instance>;

const setups: { [browserType: string]: (browser: Browser, options: LaunchOptions) => Promise<SetupResult> } = {};

/**
 * Get the major section of a semver string
 */
function major(version: string): number {
    return parseInt(version.split('.')[0], 10);
}

/**
 * Copy a file
 */
async function copy(src: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const rs = fs.createReadStream(src);
        const ws = fs.createWriteStream(dest);
        let called = false;

        function done(err?: Error | null) {
            if (!called) {
                called = true;
                if (err) reject(err);
                else resolve();
            }
        }

        rs.on('error', done);
        ws.on('error', done);
        ws.on('close', () => {
            done();
        });

        rs.pipe(ws);
    });
}

/**
 * Check if the given version matches the pattern
 */
function matches(version: string, pattern: string | undefined): boolean {
    if (pattern === undefined || pattern === '*') {
        return true;
    }

    const vs = version.split('.');
    const ps = pattern.split('.');

    for (let i = 0; i < ps.length; i++) {
        if (ps[i] === 'x' || ps[i] === '*') {
            continue;
        }

        if (ps[i] !== vs[i]) {
            return false;
        }
    }

    return true;
}

/**
 * In the given configuration find a browser matching specified name and version
 */
function findMatch(config: Config, name: string, version: string): Browser | undefined {
    const matching = config.browsers.filter((b) => {
        return b.name === name && matches(b.version, version);
    }).sort((a, b) => {
        return major(b.version) - major(a.version);
    });

    if (matching.length) {
        return matching[0];
    }
}

function formatNoProxyStandard(options: LaunchOptions): string {
    const value = options.noProxy || [];
    if (typeof value !== 'string') {
        return value.join(',');
    }
    return value;
}

function formatNoProxyChrome(options: LaunchOptions): string {
    const value = options.noProxy || [];
    if (typeof value !== 'string') {
        return value.join(';');
    }
    return value;
}

/**
 * Setup procedure for Firefox browser:
 * - create a temporary directory
 * - create and write prefs.js file
 * - collect command line arguments necessary to launch the browser
 */
setups.firefox = async function (browser: Browser, options: LaunchOptions): Promise<SetupResult> {
    if (options.profile === null) {
        // profile: null disables profile setup, so we can skip all of this. Unfortunately
        // it's not possible to configure other settings without controlling the profile,
        // so we error if you try:
        if (options.proxy || options.prefs) {
            throw new Error(
                "Cannot set Firefox proxy and/or prefs options when profile is set to null."
            );
        }

        return { args: options.options || [], defaultArgs: [] };
    }

    const profileDir = options.profile || path.join(os.tmpdir(), "browser-launcher" + crypto.randomBytes(5).toString('hex'));
    const file = path.join(profileDir, 'prefs.js');
    let prefs: { [key: string]: any } = options.skipDefaults ? {} : {
        'browser.shell.checkDefaultBrowser': false,
        'browser.bookmarks.restore_default_bookmarks': false,
        'dom.disable_open_during_load': false,
        'dom.max_script_run_time': 0,
        'browser.cache.disk.capacity': 0,
        'browser.cache.disk.smart_size.enabled': false,
        'browser.cache.disk.smart_size.first_run': false,
        'browser.sessionstore.resume_from_crash': false,
        'browser.startup.page': 0
    };

    fs.mkdirSync(profileDir, { recursive: true });

    options.options = options.options || [];
    if (!options.profile) {
        options.tempDir = profileDir;
    }

    if (options.proxy) {
        const match = /^(?:http:\/\/)?([^:/]+)(?::(\d+))?/.exec(options.proxy);
        const host = JSON.stringify(match![1]);
        const port = match![2] || '80';

        assign(prefs, {
            'network.proxy.http': host,
            'network.proxy.http_port': +port,
            'network.proxy.type': 1,
            'network.proxy.no_proxies_on': '"' + formatNoProxyStandard(options) + '"'
        });
    }

    if (options.prefs) {
        assign(prefs, options.prefs);
    }

    const prefsStr = Object.keys(prefs).map((name) => {
        return 'user_pref("' + name + '", ' + prefs[name] + ');';
    }).join('\n');

    options.options = options.options.concat([
        '--no-remote',
        '-profile', profileDir
    ]);

    await new Promise<void>((resolve, reject) => {
        fs.writeFile(file, prefsStr, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    return { args: options.options, defaultArgs: [] };
};

/**
 * Setup procedure for IE and Safari browsers:
 *  - just return empty arrays, can't really set any options
 */
setups.safari = async function (browser: Browser, options: LaunchOptions): Promise<SetupResult> {
    return { args: [], defaultArgs: [] };
};
setups.ie = setups.safari;

/**
 * Setup procedure for Chrome browser:
 * - collect command line arguments necessary to launch the browser
 */
setups.chrome = async function (browser: Browser, options: LaunchOptions): Promise<SetupResult> {
    options.options = options.options || [];
    const profile = options.profile !== undefined
        ? options.profile
        : browser.profile;
    options.options.push(profile ? '--user-data-dir=' + profile : null as any);
    if (options.proxy) {
        options.options.push('--proxy-server=' + options.proxy);
    }

    const noProxy = formatNoProxyChrome(options);
    if (noProxy) {
        options.options.push('--proxy-bypass-list=' + noProxy);
    }

    const defaults = [
        '--disable-restore-session-state',
        '--no-default-browser-check',
        '--disable-popup-blocking',
        '--disable-translate',
        '--start-maximized',
        '--disable-default-apps',
        '--disable-sync',
        '--enable-fixed-layout',
        '--no-first-run',
        '--noerrdialogs'
    ];

    return { args: options.options, defaultArgs: defaults };
};
setups.chromium = setups.chrome;

// Brave, new MS Edge & Arc are all Chromium based, treated as identical:
setups.msedge = setups.chrome;
setups.brave = setups.chrome;
setups.arc = setups.chrome;

/**
 * Setup procedure for PhantomJS:
 * - configure PhantomJS to open res/phantom.js script
 */
setups.phantomjs = async function (browser: Browser, options: LaunchOptions): Promise<SetupResult> {
    options.options = options.options || [];

    return {
        args: options.options.concat([
            options.proxy ? '--proxy=' + options.proxy.replace(/^http:\/\//, '') : null as any,
            path.join(import.meta.dirname, '../res/phantom.js'),
            [] as any
        ]),
        defaultArgs: []
    };
};

/**
 * Setup procedure for Opera browser:
 * - copy the default preferences file depending on the Opera version
 *   (res/operaprefs.ini or res/Preferences) to the profile directory
 * - collect command line arguments necessary to launch the browser
 */
setups.opera = async function (browser: Browser, options: LaunchOptions): Promise<SetupResult> {
    const prefs: { [key: string]: string } = {
        old: 'operaprefs.ini',
        blink: 'Preferences'
    };
    const engine: { [key: string]: string[] } = {
        old: [
            '-nosession',
            '-nomail'
        ],
        // using the same rules as for chrome
        blink: [
            '--disable-restore-session-state',
            '--no-default-browser-check',
            '--disable-popup-blocking',
            '--disable-translate',
            '--start-maximized',
            '--disable-default-apps',
            '--disable-sync',
            '--enable-fixed-layout',
            '--no-first-run',
            '--noerrdialogs'
        ]
    };
    const generation = major(browser.version) >= 15 ? 'blink' : 'old';
    const prefFile = prefs[generation];
    const src = path.join(import.meta.dirname, '../res/' + prefFile);

    const profile = options.profile || browser.profile;
    fs.mkdirSync(profile as string, { recursive: true }); // Make sure profile exists

    const dest = path.join(profile as string, prefFile);

    options.options = options.options || [];
    if (generation === 'blink') {
        options.options.push(profile ? '--user-data-dir=' + profile : null as any);

        if (options.proxy) {
            options.options.push('--proxy-server=' + options.proxy);
        }

        const noProxy = formatNoProxyChrome(options);
        if (noProxy) {
            options.options.push('--proxy-bypass-list=' + noProxy);
        }
    }

    await copy(src, dest);
    return { args: options.options, defaultArgs: engine[generation] };
};

/**
 * Run a browser
 * @returns function which runs a browser, or undefined if browser can't be located
 */
function runBrowser(config: Config, name: string, version: string): BrowserRunner | undefined {
    let browser = findMatch(config, name, version);

    if (!browser) {
        return undefined;
    }

    return async function (uri: string, options: LaunchOptions): Promise<Instance> {
        async function run(customEnv: NodeJS.ProcessEnv): Promise<Instance> {
            const env: NodeJS.ProcessEnv = {};
            let cwd = process.cwd();

            // copy environment variables
            Object.keys(process.env).forEach((key) => {
                env[key] = process.env[key];
            });

            Object.keys(customEnv).forEach((key) => {
                env[key] = customEnv[key];
            });

            // Shallow clone the browser config, as we may mutate it below
            browser = Object.assign({}, browser);

            // setup the browser
            const { args, defaultArgs } = await setups[browser!.type](browser!, options);

            let finalArgs = args;
            if (!options.skipDefaults) {
                finalArgs = finalArgs.concat(defaultArgs);
            }

            // pass proxy configuration to the new environment
            const noProxy = formatNoProxyStandard(options);
            if (noProxy && env.no_proxy === undefined) {
                env.no_proxy = noProxy;
            }

            if (options.proxy && env.http_proxy === undefined) {
                env.http_proxy = options.proxy;
            }

            if (options.proxy && env.HTTP_PROXY === undefined) {
                env.HTTP_PROXY = options.proxy;
            }

            // prepare the launch command for Windows systems
            if (process.platform === 'win32') {
                // ensure all the quotes are removed
                browser!.command = browser!.command.replace(/"/g, '');
                // change directory to the app's base (Chrome)
                cwd = path.dirname(browser!.command);
            }

            // prepare the launch command for OSX systems
            if (process.platform === 'darwin' && browser!.command.endsWith('.app')) {
                // use the binary paths under the hood

                // open --wait-apps --new --fresh -a /Path/To/Executable <url> --args <rest of app args>
                finalArgs.unshift(
                    '--wait-apps',
                    ...(!browser!.neverStartFresh // Some browsers can't start fresh, so don't bother
                        ? [
                            '--new',
                            '--fresh',
                        ] : []
                    ),
                    '-a',
                    browser!.command,
                    ...((finalArgs.length || uri) ? ['--args'] : []),
                    uri
                );

                browser!.processName = browser!.command;
                browser!.command = 'open';
            } else {
                finalArgs.push(uri);
            }

            browser!.tempDir = options.tempDir;

            return new Instance(assign({}, browser, {
                args: finalArgs.filter(Boolean),
                detached: options.detached,
                env: env,
                cwd: cwd
            }));
        }

        // run a regular browser in a "headless" mode
        if (options.headless && !browser!.headless) {
            return new Promise((resolve, reject) => {
                headless((err: Error | null, proc: any, display: number) => {
                    if (err) {
                        return reject(err);
                    }

                    run({
                        DISPLAY: ':' + display
                    }).then(resolve).catch(reject);
                });
            });
        } else {
            return run({});
        }
    };
}

export { runBrowser };
