import * as fs from 'fs';
import * as path from 'path';
const packageJson = require('../package.json');
const osenv = require('osenv');

const defaultConfigFile = osenv.home() + '/.config/' + packageJson.name.split('/')[1] + '/config.json';

interface Config {
    browsers: any[];
}

type ReadCallback = (err: Error | null, data?: Config | null, configDir?: string) => void;
type WriteCallback = (err?: Error | null) => void;

/**
 * Read a configuration file
 */
function read(callback: ReadCallback): void;
function read(configFile: string, callback: ReadCallback): void;
function read(configFileOrCallback: string | ReadCallback, callback?: ReadCallback): void {
    let configFile: string;
    let cb: ReadCallback;

    if (typeof configFileOrCallback === 'function') {
        cb = configFileOrCallback;
        configFile = defaultConfigFile;
    } else {
        configFile = configFileOrCallback || defaultConfigFile;
        cb = callback!;
    }

    const configDir = path.dirname(configFile);

    fs.mkdir(configDir, { recursive: true }, (mkdirErr) => {
        if (mkdirErr) {
            return cb(mkdirErr);
        }

        fs.exists(configFile, (exists) => {
            if (exists) {
                fs.readFile(configFile, (readErr, src) => {
                    if (readErr) return cb(readErr);

                    let data: Config;
                    try {
                        data = JSON.parse(src.toString());
                    } catch (e) {
                        return cb(e as Error);
                    }

                    cb(null, data, configDir);
                });
            } else {
                cb(null, null, configDir);
            }
        });
    });
}

/**
 * Write a configuration file
 */
function write(config: Config, callback?: WriteCallback): void;
function write(configFile: string, config: Config, callback?: WriteCallback): void;
function write(configFileOrConfig: string | Config, configOrCallback?: Config | WriteCallback, callback?: WriteCallback): void {
    let configFile: string;
    let config: Config;
    let cb: WriteCallback;

    if (typeof configFileOrConfig === 'object') {
        configFile = defaultConfigFile;
        config = configFileOrConfig;
        cb = (configOrCallback as WriteCallback) || (() => {});
    } else {
        configFile = configFileOrConfig;
        config = configOrCallback as Config;
        cb = callback || (() => {});
    }

    fs.mkdir(path.dirname(configFile), { recursive: true }, (err) => {
        if (err) {
            return cb(err);
        }

        fs.writeFile(configFile, JSON.stringify(config, null, 2), cb);
    });
}

export { defaultConfigFile, read, write };
