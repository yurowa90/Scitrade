import { runnerImport } from '/home/user/Scitrade/node_modules/vite/dist/node/index.js';
const { module } = await runnerImport(process.argv[2], { configFile: false, logLevel: 'error' });
console.log(JSON.stringify(module.run(Number(process.argv[3]), process.argv[4], process.argv[5]), null, 1));
