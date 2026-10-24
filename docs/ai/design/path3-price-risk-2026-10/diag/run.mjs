import { runnerImport } from '/home/user/Scitrade/node_modules/vite/dist/node/index.js';
import { writeFileSync } from 'node:fs';
const { module } = await runnerImport(process.argv[2], { configFile: false, logLevel: 'error' });
writeFileSync(process.argv[3], JSON.stringify(module.run(JSON.parse(process.argv[4]))));
