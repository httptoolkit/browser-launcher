import { expect } from 'chai';
import { getLauncher, detectBrowsers, updateBrowsers } from '../src/index.js';

describe('Browser Launcher Integration Tests', function() {
    // Browser detection can be slow on some systems
    this.timeout(10000);

    describe('detectBrowsers()', function() {
        it('should detect browsers and return an array', async function() {
            const browsers = await detectBrowsers();
            expect(browsers).to.be.an('array');
        });

        it('should find at least one browser on the system', async function() {
            const browsers = await detectBrowsers();
            expect(browsers.length).to.be.at.least(1,
                'Expected at least one browser to be installed on the system');
        });

        it('should return browsers with required properties', async function() {
            const browsers = await detectBrowsers();
            expect(browsers.length).to.be.at.least(1);

            const browser = browsers[0];
            expect(browser).to.have.property('name').that.is.a('string');
            expect(browser).to.have.property('version').that.is.a('string');
            expect(browser).to.have.property('type').that.is.a('string');
            expect(browser).to.have.property('command').that.is.a('string');
        });

        it('should return valid browser types', async function() {
            const validTypes = ['chrome', 'chromium', 'firefox', 'safari', 'ie',
                               'msedge', 'brave', 'opera', 'phantomjs', 'arc'];

            const browsers = await detectBrowsers();
            browsers.forEach(function(browser) {
                expect(validTypes).to.include(browser.type,
                    `Browser type "${browser.type}" is not in the list of valid types`);
            });
        });

        it('should return non-empty version strings', async function() {
            const browsers = await detectBrowsers();
            browsers.forEach(function(browser) {
                expect(browser.version).to.not.be.empty;
                expect(browser.version).to.match(/\d+/,
                    `Version "${browser.version}" for ${browser.name} should contain at least one digit`);
            });
        });

        it('should return non-empty command paths', async function() {
            const browsers = await detectBrowsers();
            browsers.forEach(function(browser) {
                expect(browser.command).to.not.be.empty;
            });
        });
    });

    describe('updateBrowsers()', function() {
        it('should update config and return browser list', async function() {
            const config = await updateBrowsers();
            expect(config).to.be.an('object');
            expect(config).to.have.property('browsers').that.is.an('array');
            expect(config.browsers.length).to.be.at.least(1);
        });

        it('should return browsers with full config properties', async function() {
            const config = await updateBrowsers();

            const browser = config.browsers[0];
            expect(browser).to.have.property('name');
            expect(browser).to.have.property('version');
            expect(browser).to.have.property('type');
            expect(browser).to.have.property('command');
        });
    });

    describe('getLauncher()', function() {
        it('should initialize and return launch function', async function() {
            const launch = await getLauncher();
            expect(launch).to.be.a('function');
        });

        it('should provide browsers list on launch function', async function() {
            const launch = await getLauncher();
            expect(launch).to.have.property('browsers').that.is.an('array');
            expect(launch.browsers.length).to.be.at.least(1);
        });

        it('should handle errors for non-existent browsers', async function() {
            const launch = await getLauncher();

            try {
                await launch('http://example.com', 'nonexistent-browser-xyz');
                throw new Error('Expected launch to throw an error');
            } catch (err) {
                expect(err).to.exist;
                expect(err.message).to.include('not installed');
            }
        });
    });
});
