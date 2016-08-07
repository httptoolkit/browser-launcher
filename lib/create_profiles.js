var mkdirp = require('mkdirp');
var path = require('path');

function getRandom() {
  return Math.random().toString(16).slice(2);
}


/**
 * Create profiles for the given browsers
 * @param  {Array.<Object>} browsers  Array of browsers
 * @param  {String}         configDir Path to a directory, where the profiles should be put
 * @param  {Function}       callback  Callback function
 */
module.exports = function createProfiles(browsers, configDir, callback) {
  var pending = browsers.length;

  if (!pending) {
    callback();
    return;
  }

  function checkPending() {
    return !--pending && callback();
  }

  function dirName(name, version) {
    var dir = name + '-' + version + '_' + getRandom();
    return path.join(configDir, dir);
  }

  browsers.forEach(function (browser) {
    if (browser.type === 'firefox' && browser.profile) {
      checkPending();
    } else if (browser.profile) {
      browser.profile = dirName(browser.name, browser.version);

      mkdirp(browser.profile, function (err) {
        if (err) {
          callback(err);
        } else {
          checkPending();
        }
      });
    } else {
      checkPending();
    }
  });
};
