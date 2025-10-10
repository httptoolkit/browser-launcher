import { detectBrowsers } from '../dist/index.js';

const available = await detectBrowsers();

console.log('Available browsers:');
console.dir(available);
