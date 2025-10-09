#!/usr/bin/env node
import { getLauncher } from './index.js';

const launcher = getLauncher;

const browserArg = process.argv[2];
const launchUrl = process.argv[3];

if (!browserArg) {
    // When run directly, this just lists the available browsers
    launcher.detect((available) => {
        console.log(JSON.stringify(available, null, 2));
    });
} else {
    if (browserArg === '--help') {
        console.log(`# Usage for @httptoolkit/browser-launcher bin:`);
        console.log('To scan for browsers: browser-launcher');
        console.log('To launch a browser: browser-launcher <browser-name> [url]');
    } else {
        launcher((err, launch) => {
            if (err || !launch) {
                return console.error(err);
            }

            launch(launchUrl, browserArg, (err, instance) => {
                if (err) {
                    return console.error(err);
                }

                if (instance) {
                    console.log(`${browserArg} launched with PID: ${instance.pid}`);
                }
            });
        });
    }
}
