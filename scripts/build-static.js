'use strict';

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const template = path.join(root, 'views', 'index.ejs');
const publicDir = path.join(root, 'public');

async function build() {
  const html = await ejs.renderFile(template, {}, { async: true });

  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });

  fs.writeFileSync(path.join(dist, 'index.html'), html, 'utf8');
  fs.cpSync(publicDir, dist, { recursive: true });

  // Keep GitHub Pages from running Jekyll on the build output.
  fs.writeFileSync(path.join(dist, '.nojekyll'), '');

  console.log(`Static site built in ${path.relative(root, dist)}/`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
