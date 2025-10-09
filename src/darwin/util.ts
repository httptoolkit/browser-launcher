import * as fs from 'fs';
import * as path from 'path';
import plist from 'simple-plist';
import { findExecutableById } from '@httptoolkit/osx-find-executable';

const infoCache: { [file: string]: any } = Object.create(null);

function parse(file: string, callback: (err: string | null, data: any) => void): void {
    if (infoCache[file]) {
        return callback(null, infoCache[file]);
    }

    fs.exists(file, (exists) => {
        if (!exists) {
            return callback('cannot parse non-existent plist', null);
        }

        plist.readFile(file, (err: Error | null, data: any) => {
            infoCache[file] = data;
            callback(err ? err.message : null, data);
        });
    });
}

function findBundle(bundleId: string, callback: (err: Error | null | string, bundlePath?: string) => void): void {
    findExecutableById(bundleId).then((execPath) => {
        callback(
            null,
            // Executable is always ${bundle}/Contents/MacOS/${execName},
            // so we just need to strip the last few levels:
            path.dirname(path.dirname(path.dirname(execPath)))
        );
    }).catch((err) => callback(err));
}

function getInfoPath(p: string): string {
    return path.join(p, 'Contents', 'Info.plist');
}

function getInfoKey(bundleId: string, key: string, callback: (err: Error | string | null, value?: any) => void): void {
    findBundle(bundleId, (findErr, bundlePath) => {
        if (findErr) {
            return callback(findErr);
        }

        parse(getInfoPath(bundlePath!), (infoErr, data) => {
            if (infoErr) {
                return callback(infoErr);
            }

            callback(null, data[key]);
        });
    });
}

export { findBundle as find, getInfoKey };
