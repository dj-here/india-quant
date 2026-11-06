const fs = require('node:fs');
const path = require('node:path');

// When running on Node < 18.17 (e.g. 18.13 locally), Next.js default check exits early.
// This postinstall patch ensures Next.js runs cleanly on Node 18.13+ local environments,
// while Vercel and GitHub Actions run Node 20+ by default.
const nextBinPath = path.resolve(__dirname, '../node_modules/next/dist/bin/next');

if (fs.existsSync(nextBinPath)) {
  let content = fs.readFileSync(nextBinPath, 'utf8');
  if (content.includes('"18.17.0"')) {
    content = content.replace(/"18\.17\.0"/g, '"18.13.0"');
    fs.writeFileSync(nextBinPath, content, 'utf8');
    console.log('[Starfall Postinstall] Successfully patched Next.js bin for Node 18.13+ compatibility.');
  }
}
