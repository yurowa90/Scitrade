import { runnerImport } from '/home/user/Scitrade/node_modules/vite/dist/node/index.js';
import { writeFileSync } from 'node:fs';
const { module } = await runnerImport(process.argv[2], { configFile: false, logLevel: 'error' });
const r = module.run(Number(process.argv[3]), process.argv[4], process.argv[5]);
for (const [d, text] of Object.entries(r)) { const f = `${process.argv[6]}/save-${process.argv[3]}-d${d}.json`; writeFileSync(f, text); console.log(f, text.length); }
