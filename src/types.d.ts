declare module 'win-detect-browsers' {
    function detect(): Promise<Array<{
        name: string;
        path: string;
        version: string;
        channel?: string;
    }>>;
    export default detect;
}

declare module 'headless' {
    import { ChildProcess } from 'child_process';
    function headless(callback: (err: Error | null, proc: ChildProcess, display: number) => void): void;
    export default headless;
}

declare module 'simple-plist' {
    export type PlistValue = string | number | boolean | Date | Buffer | PlistObject | PlistArray;
    export interface PlistObject {
        [key: string]: PlistValue;
    }
    export interface PlistArray extends Array<PlistValue> {}

    interface SimplePlist {
        readFile(file: string, callback: (err: Error | null, data: PlistObject) => void): void;
        readFileSync(file: string): PlistObject;
        writeFile(file: string, data: PlistObject, callback: (err: Error | null) => void): void;
        writeFileSync(file: string, data: PlistObject): void;
    }
    const plist: SimplePlist;
    export default plist;
}
