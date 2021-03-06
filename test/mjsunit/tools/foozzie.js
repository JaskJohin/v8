// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --allow-natives-syntax
// Files: tools/clusterfuzz/v8_mock.js

// Test foozzie mocks for differential fuzzing.

// Deterministic Math.random.
assertEquals(0.1, Math.random());
assertEquals(0.2, Math.random());
assertEquals(0.3, Math.random());

// Deterministic date.
assertEquals(1477662728698, Date.now());
assertEquals(1477662728701, Date.now());
assertEquals(1477662728705, new Date().getTime());

// Deterministic arguments in constructor keep working.
assertEquals(819134640000,
             new Date('December 17, 1995 03:24:00 GMT+1000').getTime());

// Dummy performance methods.
assertEquals(1.2, performance.now());
assertEquals([], performance.measureMemory());

// Worker messages follow a predefined deterministic pattern.
const worker = new Worker(``, {type: 'string'});
assertEquals(0, worker.getMessage());
assertEquals(-1, worker.getMessage());

// NaN patterns in typed arrays are mocked out. Test that we get no
// difference between unoptimized and optimized code.
function testSameOptimized(pattern, create_fun) {
  const expected = new Uint32Array(pattern);
  %PrepareFunctionForOptimization(create_fun);
  assertEquals(expected, create_fun());
  %OptimizeFunctionOnNextCall(create_fun);
  assertEquals(expected, create_fun());
}

function testArrayType(arrayType, pattern) {
  // Test passing NaNs to constructor with array.
  let create = function() {
    return new Uint32Array(new arrayType([-NaN]).buffer);
  };
  testSameOptimized(pattern, create);
  // Test passing NaNs to constructor with iterator.
  create = function() {
    const iter = function*(){ yield* [-NaN]; }();
    return new Uint32Array(new arrayType(iter).buffer);
  };
  testSameOptimized(pattern, create);
  // Test setting NaN property.
  create = function() {
    const arr = new arrayType(1);
    arr[0] = -NaN;
    return new Uint32Array(arr.buffer);
  };
  // Test passing NaN using set.
  testSameOptimized(pattern, create);
  create = function() {
    const arr = new arrayType(1);
    arr.set([-NaN], 0);
    return new Uint32Array(arr.buffer);
  };
  testSameOptimized(pattern, create);
}

testArrayType(Float32Array, [1065353216]);
testArrayType(Float64Array, [0, 1072693248]);
