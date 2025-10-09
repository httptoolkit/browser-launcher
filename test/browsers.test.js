import { expect } from 'chai';
import { Browsers } from '../src/browsers.js';

describe('Browsers', function() {
    describe('browserPlatforms()', function() {
        it('should handle browser platforms without any variants', function() {
            const browsers = new Browsers({
                firefox: {}
            });

            expect(browsers.browserPlatforms()).to.deep.equal([{
                type: 'firefox',
                darwin: 'firefox',
                linux: ['firefox'],
                regex: undefined
            }]);
        });

        it('should handle browser platforms with multiple variants', function() {
            const browsers = new Browsers({
                firefox: {
                    variants: {
                        'firefox': ['firefox'],
                        'firefox-developer': ['firefox-developer']
                    }
                }
            });

            expect(browsers.browserPlatforms()).to.deep.equal([{
                type: 'firefox',
                darwin: 'firefox',
                linux: ['firefox'],
                regex: undefined
            }, {
                type: 'firefox',
                darwin: 'firefox-developer',
                linux: ['firefox-developer'],
                regex: undefined
            }]);
        });

        it('should handle browser platforms when command is different from variant name', function() {
            const browsers = new Browsers({
                chrome: {
                    variants: {
                        'chrome': ['google-chrome']
                    }
                }
            });

            expect(browsers.browserPlatforms()).to.deep.equal([{
                type: 'chrome',
                darwin: 'chrome',
                linux: ['google-chrome'],
                regex: undefined
            }]);
        });

        it('should handle browser platforms when multiple commands are possible for a variant', function() {
            const browsers = new Browsers({
                chrome: {
                    variants: {
                        'chrome': ['google-chrome', 'google-chrome-stable']
                    }
                }
            });

            expect(browsers.browserPlatforms()).to.deep.equal([{
                type: 'chrome',
                darwin: 'chrome',
                linux: ['google-chrome', 'google-chrome-stable'],
                regex: undefined
            }]);
        });
    });

    describe('typeConfig()', function() {
        it('should return browser config by type', function() {
            const browsers = new Browsers({
                chrome: {
                    profile: true
                },
                firefox: {
                    profile: false
                }
            });

            expect(browsers.typeConfig('firefox')).to.deep.equal({
                profile: false
            });
        });

        it('should support all config options', function() {
            const browsers = new Browsers({
                chrome: {
                    startupTime: 1000,
                    nsaUplink: true,
                    'john-cena': 'champ'
                }
            });

            expect(browsers.typeConfig('chrome')).to.deep.equal({
                startupTime: 1000,
                nsaUplink: true,
                'john-cena': 'champ'
            });
        });
    });
});
