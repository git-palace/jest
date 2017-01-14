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

let createRuntime;

describe('Runtime', () => {

  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('jest.spyOn', () => {
    it('calls the mock and the ', () =>
      createRuntime(__filename).then(runtime => {
        const root = runtime.requireModule(runtime.__mockRootPath);

        let isOriginalCalled = false;
        const obj = {method: () => {
          isOriginalCalled = true;
        }};

        const spy = root.jest.spyOn(obj, 'method');

        obj.method();

        expect(isOriginalCalled).toBe(false);
        expect(spy).toHaveBeenCalled();
      }),
    );
  });
});
