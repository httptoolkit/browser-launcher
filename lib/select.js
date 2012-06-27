var headless = require('headless');
return;

var opts = {};
opts.firefox = {
    
};

var args = [
    '--proxy-server=' + opts.proxy,
    '--user-data-dir=' + profileDir,
    uri
];
if (opts.headless && !rec.headless) {
    args.unshift('xvfb-run', '-w', '0', '-a');
}

module.exports = function (config, name, version) {
    return function (uri, opts) {
        
    };
};
