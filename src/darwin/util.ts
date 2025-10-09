import * as fs from 'fs/promises';
import * as path from 'path';
import plist from 'simple-plist';
import { findExecutableById } from '@httptoolkit/osx-find-executable';

const infoCache: { [file: string]: any } = Object.create(null);

async function parse(file: string): Promise<any> {
    if (infoCache[file]) {
        return infoCache[file];
    }

    try {
        await fs.access(file);
    } catch {
        throw new Error('cannot parse non-existent plist');
    }

    return new Promise((resolve, reject) => {
        plist.readFile(file, (err: Error | null, data: any) => {
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

async function getInfoKey(bundleId: string, key: string): Promise<any> {
    const bundlePath = await findBundle(bundleId);
    const data = await parse(getInfoPath(bundlePath));
    return data[key];
}

export { findBundle as find, getInfoKey };
