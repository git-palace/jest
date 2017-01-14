/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

const chalk = require('chalk');
const {KEYS} = require('../constants');

const runJestMock = jest.fn();

jest.mock('ansi-escapes', () => ({
  clearScreen: '[MOCK - clearScreen]',
  cursorHide: '[MOCK - cursorHide]',
  cursorRestorePosition: '[MOCK - cursorRestorePosition]',
  cursorSavePosition: '[MOCK - cursorSavePosition]',
  cursorShow: '[MOCK - cursorShow]',
  cursorTo: (x, y) => `[MOCK - cursorTo(${x}, ${y})]`,
}));

jest.mock('../SearchSource', () => class {
  findMatchingTests(pattern) {
    const paths = [
      './path/to/file1-test.js',
      './path/to/file2-test.js',
      './path/to/file3-test.js',
      './path/to/file4-test.js',
      './path/to/file5-test.js',
      './path/to/file6-test.js',
      './path/to/file7-test.js',
      './path/to/file8-test.js',
      './path/to/file9-test.js',
      './path/to/file10-test.js',
      './path/to/file11-test.js',
    ].filter(path =>  path.match(pattern));

    return {paths};
  }
});

jest.doMock('chalk', () => new chalk.constructor({enabled: false}));
jest.doMock('../runJest', () => function() {
  const args = Array.from(arguments);
  runJestMock.apply(null, args);

  // Call the callback
  args[args.length - 1]({snapshot: {}});

  return Promise.resolve();
});

const watch = require('../watch');

afterEach(runJestMock.mockReset);

describe('Watch mode flows', () => {
  let pipe;
  let hasteMap;
  let argv;
  let hasteContext;
  let config;
  let stdin;

  beforeEach(() => {
    pipe = {write: jest.fn()};
    hasteMap = {on: () => {}};
    argv = {};
    hasteContext = {};
    config = {};
    stdin = new MockStdin();
  });

  it('Pressing "P" enters pattern mode', () => {
    config = {rootDir: ''};
    watch(config, pipe, argv, hasteMap, hasteContext, stdin);

    // Write a enter pattern mode
    stdin.emit(KEYS.P);
    expect(pipe.write).toBeCalledWith(' pattern › ');

    const assertPattern = hex => {
      pipe.write.mockReset();
      stdin.emit(hex);
      expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    };

    const toHex = char => Number(char.charCodeAt(0)).toString(16);

    // Write a pattern
    ['p', '.', '*', '1', '0']
    .map(toHex)
    .forEach(assertPattern);

    [KEYS.BACKSPACE, KEYS.BACKSPACE]
    .forEach(assertPattern);

    ['3']
    .map(toHex)
    .forEach(assertPattern);

    // Runs Jest again
    runJestMock.mockReset();
    stdin.emit(KEYS.ENTER);
    expect(runJestMock).toBeCalled();

    // Argv is updated with the current pattern
    expect(argv).toEqual({
      '_': ['p.*3'],
      onlyChanged: false,
      watch: true,
      watchAll: false,
    });
  });
});

class MockStdin {
  constructor() {
    this._callbacks = [];
  }

  setRawMode() {}

  resume() {}

  setEncoding() {}

  on(evt, callback) {
    this._callbacks.push(callback);
  }

  emit(key) {
    this._callbacks.forEach(cb => cb(key));
  }
}
