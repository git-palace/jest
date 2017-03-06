/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */

'use strict';

const printImmutable = require('./printImmutable');
const IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';
const IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

const isSet = (maybeSet: Object) => {
  return !!(maybeSet && maybeSet[IS_SET_SENTINEL]);
};

const isOrdered = (maybeOrdered: Object) => {
  return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
};

const isOrderedSet = (maybeOrderedSet: Object) => {
  return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet);
};

const test = (object: Object) => object && isOrderedSet(object);

const print = (
  val: Object, 
  print: Function,
  indent: Function,
  opts: Object,
  colors: Object
) => {
  return printImmutable(val, print, indent, opts, colors, 'OrderedSet', false);
};

module.exports = {print, test};
