declare module 'win-detect-browsers' {
    function detect(callback: (error: Error | null, browsers: any[]) => void): void;
    export = detect;
}

declare module 'rimraf' {
    function rimraf(path: string, callback: (err: Error | null) => void): void;
    export = rimraf;
}

declare module 'headless' {
    function headless(callback: (err: Error | null, proc: any, display: number) => void): void;
    export = headless;
}

declare module 'osenv' {
    export function home(): string;
}
