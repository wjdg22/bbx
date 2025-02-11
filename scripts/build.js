import fs from 'fs-extra';

const copy = {
  './src/index.html': './public/index.html',
  './src/pwa/service-worker.js': './public/service-worker.js',
  './src/pwa/loader.js': './public/pwa/loader.js',
  './data/all-products-history.json': './public/data/all-products-history.json',
  './data/movie-names.json': './public/data/movie-names.json',
};
const cacheBuster = new Date().getTime();
const argv = process.argv;
const isProd = argv.includes('--prod');
const copiedFiles = [];

Object.entries(copy).map(([src, dest]) => {
  let fileContent = fs.readFileSync(src, 'utf-8');
  fileContent = fileContent
    // replace cachebuster at <script /> and <link />
    .replace(/\?cb=\d*"/g, `?cb=${cacheBuster}"`)
    // replace cachebuster for ajax on global window
    .replace(/(cacheBuster=')\d*(')/, `$1${cacheBuster}$2`)
    // replace cachebuster in service worker cache
    .replace(/cacheBuster-v1/, `cache-${cacheBuster}`);

  if (isProd) {
    fileContent = fileContent
      // activate tracking scripts
      .replace(/Xsrc/g, 'src');

    // reduce json
    if (src.includes('.json')) {
      const json = JSON.parse(fileContent);
      fileContent = JSON.stringify(json);
    }
  }
  // create dest dir and remove file from path to get dir name
  fs.mkdirsSync(dest.substring(0, dest.lastIndexOf('/')));
  // create file
  fs.writeFileSync(dest, fileContent, 'utf-8');
  copiedFiles.push(dest);
});

console.log(`updated cache bust and tracking in ${copiedFiles} isProd:${isProd}`);
