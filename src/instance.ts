import { EventEmitter } from 'events';
import { spawn, exec, ChildProcess } from 'child_process';
const rimraf = require('rimraf');
import { Readable } from 'stream';

interface InstanceOptions {
    args: string[];
    command: string;
    cwd: string;
    detached?: boolean;
    env: NodeJS.ProcessEnv;
    image?: string;
    processName?: string;
    tempDir?: string;
    type: string;
    name?: string;
}

/**
 * Web browser instance
 */
class Instance extends EventEmitter {
    command: string;
    args: string[];
    image?: string;
    processName?: string;
    tempDir?: string;
    browserType: string;
    process: ChildProcess;
    pid: number | undefined;
    stdout: Readable | null;
    stderr: Readable | null;

    constructor(options: InstanceOptions) {
        super();

        this.command = options.command;
        this.args = options.args;
        this.image = options.image;
        this.processName = options.processName;
        this.tempDir = options.tempDir;
        this.browserType = options.type; // saving the type of browser instance for issue# 49

        this.process = spawn(this.command, this.args, {
            detached: options.detached,
            env: options.env,
            cwd: options.cwd
        });

        this.pid = this.process.pid;
        this.stdout = this.process.stdout;
        this.stderr = this.process.stderr;

        // on Windows Opera uses a launcher which is stopped immediately after opening the browser
        // so it makes no sense to bind a listener, though we won't be noticed about crashes...
        if (options.name === 'opera' && process.platform === 'win32') {
            return;
        }

        // trigger "stop" event when the process exits
        this.process.on('close', this.emit.bind(this, 'stop'));

        // clean-up the temp directory once the instance stops
        if (this.tempDir) {
            this.on('stop', () => {
                rimraf(this.tempDir!, () => { /* .. */ });
            });
        }
    }

    /**
     * Stop the instance
     * @param callback Callback function called when the instance is stopped
     */
    stop(callback?: () => void): void {
        if (typeof callback === 'function') {
            this.once('stop', callback);
        }

        // Opera case - it uses a launcher so we have to kill it somehow without a reference to the process
        if (process.platform === 'win32' && this.image) {
            exec('taskkill /F /IM ' + this.image)
                .on('close', this.emit.bind(this, 'stop'));
            // ie case on windows machine
        } else if (process.platform === 'win32' && this.browserType === 'ie') {
            exec('taskkill /F /IM iexplore.exe')
                .on('close', this.emit.bind(this, 'stop'));
            // OSX case with "open" command
        } else if (this.command === 'open') {
            exec('osascript -e \'tell application "' + this.processName + '" to quit\'');
            // every other scenario
        } else {
            this.process.kill();
        }
    }
}

export = Instance;
