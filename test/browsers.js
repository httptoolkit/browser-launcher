/**
 * Created by mitch on 2/29/16.
 */
import test from 'ava';
import Browsers from '../lib/browsers';

test('browser platforms without any variants', t => {
    var browsers = new Browsers({
        firefox: {}
    });

    t.same(browsers.browserPlatforms(), [{
        type: 'firefox',
        darwin: 'firefox',
        linux: ['firefox'],
        regex: undefined
    }]);
});

test('browser platforms with multiple variants', t => {
    var browsers = new Browsers({
        firefox: {
            variants: {
                'firefox': ['firefox'],
                'firefox-developer': ['firefox-developer']
            }
        }
    });

    t.same(browsers.browserPlatforms(), [{
        type: 'firefox',
        darwin: 'firefox',
        linux: ['firefox'],
        regex: undefined
    },{
        type: 'firefox',
        darwin: 'firefox-developer',
        linux: ['firefox-developer'],
        regex: undefined
    }]);
});

test('browser platforms when command is different from variant name', t => {
    var browsers = new Browsers({
        chrome: {
            variants: {
                'chrome': ['google-chrome']
            }
        }
    });

    t.same(browsers.browserPlatforms(), [{
        type: 'chrome',
        darwin: 'chrome',
        linux: ['google-chrome'],
        regex: undefined
    }]);
});

test('browser platforms when multiple commands are possible for a variant', t => {
    var browsers = new Browsers({
        chrome: {
            variants: {
                'chrome': ['google-chrome', 'google-chrome-stable']
            }
        }
    });

    t.same(browsers.browserPlatforms(), [{
        type: 'chrome',
        darwin: 'chrome',
        linux: ['google-chrome', 'google-chrome-stable'],
        regex: undefined
    }]);
});

test('browser config by type', t => {
    var browsers = new Browsers({
        chrome: {
            profile: true
        },
        firefox: {
            profile: false
        }
    });

    t.same(browsers.typeConfig('firefox'), {
        profile: false
    });
});

test('browser config supports all options', t => {
    var browsers = new Browsers({
        chrome: {
            startupTime: 1000,
            nsaUplink: true,
            'john-cena': 'champ'
        }
    });

    t.same(browsers.typeConfig('chrome'), {
        startupTime: 1000,
        nsaUplink: true,
        'john-cena': 'champ'
    });
});