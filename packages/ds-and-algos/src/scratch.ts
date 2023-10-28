// Copyright (c) 2023 One Law LLC

import { PersistentTreap } from "./trees/PersistentTreap.js";

// Repeatedly remove and add from our treap
// and test `getByIndex` has no missing indices.

const SIZE = 1000; // example size
let treap = new PersistentTreap<number>((a, b) => a - b);

for (let i = 0; i < SIZE; ++i) {
  treap = treap.add(i);
}

const TRIALS = 4;
for (let i = 0; i < SIZE; ++i) {
  for (let t = 0; t < TRIALS; ++t) {
    treap = treap.delete(i);
    treap = treap.add(i);
  }
}
