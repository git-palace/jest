/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';


require('../src');

it('instruments by setting global.__INSTRUMENTED__', () => {
  expect(global.__INSTRUMENTED__).toBe(true);
});

it('preprocesses by setting global.__PREPROCESSED__', () => {
  expect(global.__PREPROCESSED__).toBe(true);
});
