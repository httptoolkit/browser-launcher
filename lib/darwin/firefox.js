var path = require('path'),
    util = require('./util');

//Fetch all known version of Firefox on the host machine
exports.all = function (callback) {
    var installed = [],
        pending = 0,
        check = function () {
            if (!pending) {
                callback(null, installed);
            }
        };

    util.find('org.mozilla.firefox', function (err, p) {
        if (p) {
            var items = p.split('\n');
            pending = items.length;
            items.forEach(function (loc) {
                util.parse(util.getInfoPath(loc), function (err, data) {
                    if (!err) {
                        installed.push({
                            version: data['CFBundleShortVersionString'],
                            path: path.join(loc, 'Contents/MacOS/firefox-bin')
                        });
                    }

                    pending--;
                    check();
                });
            });
        } else {
            callback('not installed');
        }
    });
};
