/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const formatFailureMessage = require('jest-util').formatFailureMessage;
const path = require('path');
const VerboseLogger = require('./VerboseLogger');

// Explicitly reset for these messages since they can get written out in the
// middle of error logging (should have listened to Spengler and not crossed the
// streams).
const FAIL = chalk.reset.bold.bgRed(' FAIL ');
const PASS = chalk.reset.bold.bgGreen(' PASS ');

const FAIL_COLOR = chalk.bold.red;
const LONG_TEST_COLOR = chalk.reset.bold.bgRed;
const PASS_COLOR = chalk.bold.green;
const PENDING_COLOR = chalk.bold.yellow;
const RUNNING_TEST_COLOR = chalk.bold.gray;
const SNAPSHOT_ADDED = chalk.bold.yellow;
const SNAPSHOT_UPDATED = chalk.bold.yellow;
const TEST_NAME_COLOR = chalk.bold;
const TEST_SUMMARY_THRESHOLD = 20;

const pluralize = (word, count) => `${count} ${word}${count === 1 ? '' : 's'}`;

class DefaultTestReporter {

  constructor(customProcess) {
    this._process = customProcess || process;
  }

  log(string) {
    this._process.stdout.write(string + '\n');
  }

  onRunStart(config, results) {
    this._config = config;
    this._printWaitingOn(results);
    if (this._config.verbose) {
      this.verboseLogger = new VerboseLogger(this._process);
    }
  }

  onTestResult(config, testResult, results) {
    this._clearWaitingOn();

    const pathStr =
      config.rootDir
      ? path.relative(config.rootDir, testResult.testFilePath)
      : testResult.testFilePath;
    const allTestsPassed = testResult.numFailingTests === 0;
    const runTime =
      testResult.perfStats
      ? (testResult.perfStats.end - testResult.perfStats.start) / 1000
      : null;

    const testDetail = [];
    if (runTime !== null) {
      testDetail.push(
        runTime > 5 ? LONG_TEST_COLOR(runTime + 's') : runTime + 's'
      );
    }

    if (testResult.memoryUsage) {
      const toMB = bytes => Math.floor(bytes / 1024 / 1024);
      testDetail.push(`${toMB(testResult.memoryUsage)} MB heap size`);
    }

    const resultHeader =
       `${allTestsPassed ? PASS : FAIL} ${TEST_NAME_COLOR(pathStr)}` +
       (testDetail.length ? ` (${testDetail.join(', ')})` : '');

    this.log(resultHeader);
    if (config.verbose && !testResult.testExecError) {
      this.verboseLogger.logTestResults(
        testResult.testResults
      );
    }

    if (!allTestsPassed) {
      const failureMessage = formatFailureMessage(testResult, {
        noStackTrace: config.noStackTrace,
        rootDir: config.rootDir,
        verbose: config.verbose,
      });

      this._write(failureMessage);
      testResult.message = resultHeader + '\n' + failureMessage + '\n';

      if (config.bail) {
        this.onRunComplete(config, results);
        this._process.exit(1);
      }
    }

    this._printWaitingOn(results);
  }

  onRunComplete(config, aggregatedResults) {
    const totalTestSuites = aggregatedResults.numTotalTestSuites;
    const failedTests = aggregatedResults.numFailedTests;
    const passedTests = aggregatedResults.numPassedTests;
    const pendingTests = aggregatedResults.numPendingTests;
    const totalTests = aggregatedResults.numTotalTests;
    const totalErrors = aggregatedResults.numRuntimeErrorTestSuites;
    const runTime = (Date.now() - aggregatedResults.startTime) / 1000;

    if (totalTests === 0 && totalErrors === 0) {
      return;
    }

    let results = '';
    if (failedTests) {
      results +=
        `${FAIL_COLOR(`${pluralize('test', failedTests)} failed`)}, `;
    }

    if (totalErrors) {
      results +=
        `${FAIL_COLOR(`${pluralize('test suite', totalErrors)} failed`)}, `;
    }

    if (pendingTests) {
      results +=
        `${PENDING_COLOR(`${pluralize('test', pendingTests)} skipped`)}, `;
    }

    const snapshots = this._getSnapshotSummary(aggregatedResults);
    this._printSnapshotSummary(snapshots);

    const totalSnaphots =
      snapshots.matched +
      snapshots.added +
      snapshots.updated;

    results +=
      `${PASS_COLOR(`${pluralize('test', passedTests)} passed`)} ` +
      `(${totalTests} total in ${pluralize('test suite', totalTestSuites)}, ` +
      (totalSnaphots ? pluralize('snapshot', totalSnaphots) + ', ' : '') +
      `run time ${runTime}s)`;

    this._printSummary(aggregatedResults);
    this.log(results);
  }

  _getSnapshotSummary(aggregatedResults) {
    let added = 0;
    let filesAdded = 0;
    let filesUpdated = 0;
    let matched = 0;
    let updated = 0;
    aggregatedResults.testResults.forEach(result => {
      if (result.snapshotsAdded) {
        filesAdded++;
      }
      if (result.snapshotsUpdated) {
        filesUpdated++;
      }
      added += result.snapshotsAdded;
      matched += result.snapshotsMatched;
      updated += result.snapshotsUpdated;
    });
    return {
      added,
      filesAdded,
      filesUpdated,
      matched,
      updated,
    }
  }

  _printSnapshotSummary(snapshots) {
    if (snapshots.added || snapshots.updated) {
      this.log(`${chalk.bold('Snapshot Summary')}.`);
      if (snapshots.added) {
        this.log(
          `\u203A ` +
          `${SNAPSHOT_ADDED(pluralize('snapshot', snapshots.added))} ` +
          `written in ${pluralize('test file', snapshots.filesAdded)}.`
        );
      }
      if (snapshots.updated) {
        this.log(
          `\u203A ` +
          `${SNAPSHOT_UPDATED(pluralize('snapshot', snapshots.updated))} ` +
          `updated in ${pluralize('test file', snapshots.filesUpdated)}.`
        );
      }
    }
  }

  _printSummary(aggregatedResults) {
    // If there were any failing tests and there was a large number of tests
    // executed, re-print the failing results at the end of execution output.
    const failedTests = aggregatedResults.numFailedTests;
    const runtimeErrors = aggregatedResults.numRuntimeErrorTestSuites;
    if (
      failedTests + runtimeErrors > 0 &&
      aggregatedResults.numTotalTestSuites > TEST_SUMMARY_THRESHOLD
    ) {
      this.log(chalk.bold('\nSummary of all failing tests'));
      aggregatedResults.testResults.forEach(testResult => {
        if (
          testResult.message &&
          (
            testResult.numFailingTests > 0 ||
            testResult.testExecError
          )
        ) {
          this._write(testResult.message);
        }
      });
    }
  }

  _write(string) {
    // If we write more than one character at a time it is possible that
    // node exits in the middle of printing the result.
    // If you are reading this and you are from the future, this might not
    // be true any more.
    for (let i = 0; i < string.length; i++) {
      this._process.stdout.write(string.charAt(i));
    }
    this._process.stdout.write('\n');
  }

  _clearWaitingOn() {
    this._process.stdout.write(this._config.noHighlight ? '' : '\r\x1B[K');
  }

  _printWaitingOn(results) {
    const remaining = results.numTotalTestSuites -
      results.numPassedTestSuites -
      results.numFailedTestSuites -
      results.numRuntimeErrorTestSuites;
    if (!this._config.noHighlight && remaining > 0) {
      this._process.stdout.write(RUNNING_TEST_COLOR(
        `Running ${pluralize('test suite', remaining)}...`
      ));
    }
  }

}

module.exports = DefaultTestReporter;
