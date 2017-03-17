/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {AggregatedResult} from 'types/TestResult';
import type {Config} from 'types/Config';
import type {Tests} from 'types/TestRunner';

const fs = require('fs');
const getCacheFilePath = require('jest-haste-map').getCacheFilePath;

const FAIL = 0;
const SUCCESS = 1;

class TestSequencer {
  _config: Config;
  _cache: Object;

  constructor(config: Config) {
    this._config = config;
    this._cache = {};
  }

  _getTestPerformanceCachePath() {
    return getCacheFilePath(
      this._config.cacheDirectory,
      'perf-cache-' + this._config.name,
    );
  }

  // When running more tests than we have workers available, sort the tests
  // by size - big test files usually take longer to complete, so we run
  // them first in an effort to minimize worker idle time at the end of a
  // long test run.
  //
  // After a test run we store the time it took to run a test and on
  // subsequent runs we use that to run the slowest tests first, yielding the
  // fastest results.
  sort(testPaths: Array<string>): Tests {
    const config = this._config;
    const stats = {};
    const fileSize = filePath =>
      stats[filePath] || (stats[filePath] = fs.statSync(filePath).size);
    const failed = filePath =>
      this._cache[filePath] && this._cache[filePath][0] === FAIL;
    const time = filePath => this._cache[filePath] && this._cache[filePath][1];

    this._cache = {};
    try {
      if (this._config.cache) {
        this._cache = JSON.parse(
          fs.readFileSync(this._getTestPerformanceCachePath(), 'utf8'),
        );
      }
    } catch (e) {}

    testPaths = testPaths.sort((pathA, pathB) => {
      const failedA = failed(pathA);
      const failedB = failed(pathB);
      if (failedA !== failedB) {
        return failedA ? -1 : 1;
      }
      const timeA = time(pathA);
      const timeB = time(pathB);
      const hasTimeA = timeA != null;
      const hasTimeB = timeB != null;
      // Check if only one of two tests has timing information
      if (hasTimeA != hasTimeB) {
        return hasTimeA ? 1 : -1;
      }
      if (timeA != null && !timeB != null) {
        return timeA < timeB ? 1 : -1;
      }
      return fileSize(pathA) < fileSize(pathB) ? 1 : -1;
    });

    return testPaths.map(path => ({
      config,
      duration: this._cache[path] && this._cache[path][1],
      path,
    }));
  }

  cacheResults(tests: Tests, results: AggregatedResult) {
    const cache = this._cache;
    const map = Object.create(null);
    tests.forEach(({path}) => map[path] = true);
    results.testResults.forEach(testResult => {
      if (testResult && map[testResult.testFilePath] && !testResult.skipped) {
        const perf = testResult.perfStats;
        cache[testResult.testFilePath] = [
          testResult.numFailingTests ? FAIL : SUCCESS,
          perf.end - perf.start || 0,
        ];
      }
    });
    fs.writeFileSync(
      this._getTestPerformanceCachePath(),
      JSON.stringify(cache),
    );
  }
}

module.exports = TestSequencer;
