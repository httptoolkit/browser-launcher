var launcher = require('../');

launcher.detect(function logBrowsers(available) {
  console.log('Available browsers:');
  console.dir(available);
});
