import { getLauncher } from '../dist/index.js';

const launch = await getLauncher();

const instance = await launch('http://cksource.com/', process.env.BROWSER || 'chrome');

console.log('Instance started with PID:', instance.pid);

setTimeout(function stop() {
    instance.stop();
}, 10000);

instance.on('stop', function logCode(code) {
    console.log('Instance stopped with exit code:', code);
});
