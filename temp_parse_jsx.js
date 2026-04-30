const fs = require('fs');
const esbuild = require('esbuild');
const code = fs.readFileSync('src/pages/LearnPage.jsx', 'utf8');
try {
  esbuild.transformSync(code, { loader: 'jsx' });
  console.log('OK');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
