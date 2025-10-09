#!/usr/bin/env node
import { getLauncher, detectBrowsers } from './index.js';

const browserArg = process.argv[2];
const launchUrl = process.argv[3];

if (!browserArg) {
    // When run directly, this just lists the available browsers
    detectBrowsers().then((available) => {
        console.log(JSON.stringify(available, null, 2));
    }).catch((err) => {
        console.error(err);
        process.exit(1);
    });
} else {
    if (browserArg === '--help') {
        console.log(`# Usage for @httptoolkit/browser-launcher bin:`);
        console.log('To scan for browsers: browser-launcher');
        console.log('To launch a browser: browser-launcher <browser-name> [url]');
    } else {
        getLauncher().then(async (launch) => {
            try {
                const instance = await launch(launchUrl, browserArg);
                console.log(`${browserArg} launched with PID: ${instance.pid}`);
            } catch (err) {
                console.error(err);
                process.exit(1);
            }
        }).catch((err) => {
            console.error(err);
            process.exit(1);
        });
    }
}
