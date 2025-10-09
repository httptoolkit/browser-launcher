const { expect } = require('chai');
const launcher = require('..');

describe('Browser Launcher Integration Tests', function() {
    // Browser detection can be slow on some systems
    this.timeout(10000);

    describe('detect()', function() {
        it('should detect browsers and return an array', function(done) {
            launcher.detect(function(browsers) {
                expect(browsers).to.be.an('array');
                done();
            });
        });

        it('should find at least one browser on the system', function(done) {
            launcher.detect(function(browsers) {
                expect(browsers.length).to.be.at.least(1,
                    'Expected at least one browser to be installed on the system');
                done();
            });
        });

        it('should return browsers with required properties', function(done) {
            launcher.detect(function(browsers) {
                expect(browsers.length).to.be.at.least(1);

                const browser = browsers[0];
                expect(browser).to.have.property('name').that.is.a('string');
                expect(browser).to.have.property('version').that.is.a('string');
                expect(browser).to.have.property('type').that.is.a('string');
                expect(browser).to.have.property('command').that.is.a('string');

                done();
            });
        });

        it('should return valid browser types', function(done) {
            const validTypes = ['chrome', 'chromium', 'firefox', 'safari', 'ie',
                               'msedge', 'brave', 'opera', 'phantomjs', 'arc'];

            launcher.detect(function(browsers) {
                browsers.forEach(function(browser) {
                    expect(validTypes).to.include(browser.type,
                        `Browser type "${browser.type}" is not in the list of valid types`);
                });
                done();
            });
        });

        it('should return non-empty version strings', function(done) {
            launcher.detect(function(browsers) {
                browsers.forEach(function(browser) {
                    expect(browser.version).to.not.be.empty;
                    expect(browser.version).to.match(/\d+/,
                        `Version "${browser.version}" for ${browser.name} should contain at least one digit`);
                });
                done();
            });
        });

        it('should return non-empty command paths', function(done) {
            launcher.detect(function(browsers) {
                browsers.forEach(function(browser) {
                    expect(browser.command).to.not.be.empty;
                });
                done();
            });
        });
    });

    describe('update()', function() {
        it('should update config and return browser list', function(done) {
            launcher.update(function(err, config) {
                expect(err).to.be.null;
                expect(config).to.be.an('object');
                expect(config).to.have.property('browsers').that.is.an('array');
                expect(config.browsers.length).to.be.at.least(1);
                done();
            });
        });

        it('should return browsers with full config properties', function(done) {
            launcher.update(function(err, config) {
                expect(err).to.be.null;

                const browser = config.browsers[0];
                expect(browser).to.have.property('name');
                expect(browser).to.have.property('version');
                expect(browser).to.have.property('type');
                expect(browser).to.have.property('command');

                done();
            });
        });
    });

    describe('launcher()', function() {
        it('should initialize and return launch function', function(done) {
            launcher(function(err, launch) {
                expect(err).to.be.null;
                expect(launch).to.be.a('function');
                done();
            });
        });

        it('should provide browsers list on launch function', function(done) {
            launcher(function(err, launch) {
                expect(err).to.be.null;
                expect(launch).to.have.property('browsers').that.is.an('array');
                expect(launch.browsers.length).to.be.at.least(1);
                done();
            });
        });

        it('should handle errors for non-existent browsers', function(done) {
            launcher(function(err, launch) {
                expect(err).to.be.null;

                launch('http://example.com', 'nonexistent-browser-xyz', function(launchErr, instance) {
                    expect(launchErr).to.exist;
                    expect(launchErr).to.be.a('string');
                    expect(launchErr).to.include('not installed');
                    done();
                });
            });
        });
    });
});
