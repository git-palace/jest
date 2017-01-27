/* eslint-disable max-len, sort-keys */

'use strict';
const connect = require('connect');
const convert = require('./convert.js');
const fs = require('fs');
const http = require('http');
const optimist = require('optimist');
const path = require('path');
const reactMiddleware = require('react-page-middleware');

const argv = optimist.argv;

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FILE_SERVE_ROOT = path.join(PROJECT_ROOT, 'src');

let port = argv.port;
if (argv.$0.indexOf('node ./server/generate.js') !== -1) {
  // Using a different port so that you can publish the website
  // and keeping the server up at the same time.
  port = 8079;
}

const buildOptions = {
  projectRoot: PROJECT_ROOT,
  pageRouteRoot: FILE_SERVE_ROOT,
  useBrowserBuiltins: false,
  logTiming: true,
  useSourceMaps: true,
  ignorePaths(p) {
    return p.indexOf('__tests__') !== -1;
  },
  serverRender: true,
  dev: argv.dev !== 'false',
  static: true,
};

const app = connect()
  .use((req, res, next) => {
    // convert all the md files on every request. This is not optimal
    // but fast enough that we don't really need to care right now.
    convert();
    next();
  })
  .use('/jest/blog/feed.xml', (req, res) => {
    res.end(fs.readFileSync(path.join(FILE_SERVE_ROOT, 'jest/blog/feed.xml')) + '');
  })
  .use('/jest/blog/atom.xml', (req, res) => {
    res.end(fs.readFileSync(path.join(FILE_SERVE_ROOT, 'jest/blog/atom.xml')) + '');
  })
  .use(reactMiddleware.provide(buildOptions))
  .use(connect['static'](FILE_SERVE_ROOT))
  .use(connect.favicon(path.join(FILE_SERVE_ROOT, 'elements', 'favicon', 'favicon.ico')))
  .use(connect.logger())
  .use(connect.compress())
  .use(connect.errorHandler());

const portToUse = port || 8080;
const server = http.createServer(app);
server.listen(portToUse);
console.log('Open http://localhost:' + portToUse + '/jest/index.html');
module.exports = server;
