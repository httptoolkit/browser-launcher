#!/usr/bin/env node
const launcher = require('.');

const browserArg = process.argv[2];
const launchUrl = process.argv[3];

if (!browserArg) {
    // When run directly, this just lists the available browsers
    launcher.detect(function(available) {
        console.log(JSON.stringify(available, null, 2));
    });
} else {
    if (browserArg === '--help') {
        console.log(`# Usage for @httptoolkit/browser-launcher bin:`);
        console.log('To scan for browsers: browser-launcher');
        console.log('To launch a browser: browser-launcher <browser-name> [url]');
    } else {
        launcher(function(err, launch) {
            if (err) {
                return console.error(err);
            }

            launch(launchUrl, browserArg, function(err, instance) {
                if (err) {
                    return console.error(err);
                }

                console.log(`${browserArg} launched with PID: ${instance.pid}`);
            });
        });
    }
}
