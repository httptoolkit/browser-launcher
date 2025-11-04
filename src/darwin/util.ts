import * as fs from 'fs/promises';
import * as path from 'path';
import plist, { type PlistObject, type PlistValue } from 'simple-plist';
import { findExecutableById } from '@httptoolkit/osx-find-executable';

const infoCache: { [file: string]: PlistObject } = Object.create(null);

async function parse(file: string): Promise<PlistObject> {
    if (infoCache[file]) {
        return infoCache[file];
    }

    try {
        await fs.access(file);
    } catch {
        throw new Error('cannot parse non-existent plist');
    }

    return new Promise((resolve, reject) => {
        plist.readFile(file, (err: Error | null, data: PlistObject) => {
            if (err) {
                reject(err);
            } else {
                infoCache[file] = data;
                resolve(data);
            }
        });
    });
}

async function findBundle(bundleId: string): Promise<string> {
    const execPath = await findExecutableById(bundleId);
    // Executable is always ${bundle}/Contents/MacOS/${execName},
    // so we just need to strip the last few levels:
    return path.dirname(path.dirname(path.dirname(execPath)));
}

function getInfoPath(p: string): string {
    return path.join(p, 'Contents', 'Info.plist');
}

async function getInfoKey(bundleId: string, key: string): Promise<string> {
    const bundlePath = await findBundle(bundleId);
    const data = await parse(getInfoPath(bundlePath));
    const value = data[key];
    if (typeof value !== 'string') {
        throw new Error(`Expected string value for key ${key}, got ${typeof value}`);
    }
    return value;
}

export { findBundle as find, getInfoKey };
