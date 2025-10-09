declare module 'win-detect-browsers' {
    function detect(callback: (error: Error | null, browsers: any[]) => void): void;
    export default detect;
}

declare module 'headless' {
    function headless(callback: (err: Error | null, proc: any, display: number) => void): void;
    export default headless;
}

declare module 'simple-plist' {
    interface SimplePlist {
        readFile(file: string, callback: (err: Error | null, data: any) => void): void;
        readFileSync(file: string): any;
        writeFile(file: string, data: any, callback: (err: Error | null) => void): void;
        writeFileSync(file: string, data: any): void;
    }
    const plist: SimplePlist;
    export default plist;
}
