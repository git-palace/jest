/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.mock('fs');

const TestSequencer = require('../TestSequencer');

const fs = require('fs');

const FAIL = 0;
const SUCCESS = 1;

let sequencer;

const config = {
  cache: true,
  cacheDirectory: '/cache',
  name: 'test',
};

beforeEach(() => {
  sequencer = new TestSequencer(config);

  fs.readFileSync = jest.fn(() => '{}');
  fs.statSync = jest.fn(filePath => ({size: filePath.length}));
});

test('sorts by file size if there is no timing information', () => {
  expect(sequencer.sort(['/test-a.js', '/test-ab.js'])).toEqual([
    {config, duration: undefined, path: '/test-ab.js'},
    {config, duration: undefined, path: '/test-a.js'},
  ]);
});

test('sorts based on timing information', () => {
  fs.readFileSync = jest.fn(() => JSON.stringify({
    '/test-a.js': [SUCCESS, 5],
    '/test-ab.js': [SUCCESS, 3],
  }));
  expect(sequencer.sort(['/test-a.js', '/test-ab.js'])).toEqual([
    {config, duration: 5, path: '/test-a.js'},
    {config, duration: 3, path: '/test-ab.js'},
  ]);
});

test('sorts based on failures and timing information', () => {
  fs.readFileSync = jest.fn(() => JSON.stringify({
    '/test-a.js': [SUCCESS, 5],
    '/test-ab.js': [FAIL, 0],
    '/test-c.js': [FAIL, 6],
    '/test-d.js': [SUCCESS, 2],
  }));
  expect(
    sequencer.sort(['/test-a.js', '/test-ab.js', '/test-c.js', '/test-d.js']),
  ).toEqual([
    {config, duration: 6, path: '/test-c.js'},
    {config, duration: 0, path: '/test-ab.js'},
    {config, duration: 5, path: '/test-a.js'},
    {config, duration: 2, path: '/test-d.js'},
  ]);
});

test('sorts based on failures, timing information and file size', () => {
  fs.readFileSync = jest.fn(() => JSON.stringify({
    '/test-a.js': [SUCCESS, 5],
    '/test-ab.js': [FAIL, 1],
    '/test-c.js': [FAIL],
    '/test-d.js': [SUCCESS, 2],
    '/test-efg.js': [FAIL],
  }));
  expect(
    sequencer.sort([
      '/test-a.js',
      '/test-ab.js',
      '/test-c.js',
      '/test-d.js',
      '/test-efg.js',
    ]),
  ).toEqual([
    {config, duration: undefined, path: '/test-efg.js'},
    {config, duration: undefined, path: '/test-c.js'},
    {config, duration: 1, path: '/test-ab.js'},
    {config, duration: 5, path: '/test-a.js'},
    {config, duration: 2, path: '/test-d.js'},
  ]);
});

test('writes the cache based on the results', () => {
  fs.readFileSync = jest.fn(() => JSON.stringify({
    '/test-a.js': [SUCCESS, 5],
    '/test-b.js': [FAIL, 1],
    '/test-c.js': [FAIL],
  }));

  const testPaths = ['/test-a.js', '/test-b.js', '/test-c.js'];
  const tests = sequencer.sort(testPaths);
  sequencer.cacheResults(tests, {
    testResults: [
      {
        numFailingTests: 0,
        perfStats: {end: 2, start: 1},
        testFilePath: '/test-a.js',
      },
      {
        numFailingTests: 0,
        perfStats: {end: 0, start: 0},
        skipped: true,
        testFilePath: '/test-b.js',
      },
      {
        numFailingTests: 1,
        perfStats: {end: 4, start: 1},
        testFilePath: '/test-c.js',
      },
      {
        numFailingTests: 1,
        perfStats: {end: 2, start: 1},
        testFilePath: '/test-x.js',
      },
    ],
  });
  const fileData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(fileData).toEqual({
    '/test-a.js': [SUCCESS, 1],
    '/test-b.js': [FAIL, 1],
    '/test-c.js': [FAIL, 3],
  });
});
