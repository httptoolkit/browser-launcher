import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import packageJson from '../package.json' with { type: 'json' };
import type { Config } from './core-types.js';

const defaultConfigFile = os.homedir() + '/.config/' + packageJson.name.split('/')[1] + '/config.json';

interface ReadResult {
    data: Config | null;
    configDir: string;
}

/**
 * Read a configuration file
 */
async function read(configFile: string = defaultConfigFile): Promise<ReadResult> {
    const configDir = path.dirname(configFile);

    await fs.mkdir(configDir, { recursive: true });

    try {
        const src = await fs.readFile(configFile, 'utf-8');
        const data: Config = JSON.parse(src);
        return { data, configDir };
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            return { data: null, configDir };
        }
        throw err;
    }
}

/**
 * Write a configuration file
 */
async function write(configFile: string, config: Config): Promise<void>;
async function write(config: Config): Promise<void>;
async function write(configFileOrConfig: string | Config, config?: Config): Promise<void> {
    let configFile: string;
    let configData: Config;

    if (typeof configFileOrConfig === 'object') {
        configFile = defaultConfigFile;
        configData = configFileOrConfig;
    } else {
        configFile = configFileOrConfig;
        configData = config!;
    }

    await fs.mkdir(path.dirname(configFile), { recursive: true });
    await fs.writeFile(configFile, JSON.stringify(configData, null, 2));
}

export { defaultConfigFile, read, write };
