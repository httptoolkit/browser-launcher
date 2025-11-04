export interface Browser {
    name: string;
    version: string;
    type: string;
    command: string;
    profile: string | boolean;
    processName?: string;
    tempDir?: string;
    neverStartFresh?: boolean;
    headless?: boolean;
    regex?: RegExp;
}

export type BrowserInfo = Pick<Browser, 'name' | 'version' | 'type' | 'command'>;

export interface Config {
    browsers: Browser[];
}

export interface LaunchOptions {
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
    tempDir?: string;
}
