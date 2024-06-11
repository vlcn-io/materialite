import {describe, beforeEach, it, expect, test} from 'vitest';
import {PersistentTreap} from './persistent-treap.js';
// import { inspect } from "util";

describe('PersistentTreap', () => {
  let treap: PersistentTreap<number>;

  beforeEach(() => {
    treap = new PersistentTreap<number>((a, b) => a - b);
  });

  it('should add values correctly', () => {
    treap = treap.add(10);
    treap = treap.add(5);
    treap = treap.add(15);
    expect(treap.toArray()).toEqual([5, 10, 15]);
  });

  it('should check for contained values', () => {
    treap = treap.add(10);
    expect(treap.contains(10)).toBe(true);
    expect(treap.contains(15)).toBe(false);
  });

  // TODO: via comparator so we can actually test
  it('should replace value if it exists', () => {
    treap = treap.add(10);
    treap = treap.add(5);

    // Replacing existing value
    const newTreap = treap.add(10);

    expect(newTreap.contains(10)).toBe(true);
    expect(treap !== newTreap).toBe(true); // Ensure it's a new instance
  });

  it('should remove values correctly', () => {
    treap = treap.add(10);
    treap = treap.add(5);
    treap = treap.delete(10);
    expect(treap.contains(10)).toBe(false);
    expect(treap.toArray()).toEqual([5]);
  });

  it('should map, filter, and reduce correctly', () => {
    treap = treap.add(10);
    treap = treap.add(5);
    treap = treap.add(15);
    expect(treap.map(value => value * 2)).toEqual([10, 20, 30]);
    expect(treap.filter(value => value > 10)).toEqual([15]);
    expect(treap.reduce((acc, value) => acc + value, 0)).toBe(30);
  });
});

describe('Get operations', () => {
  let treap: PersistentTreap<number>;

  beforeEach(() => {
    treap = new PersistentTreap<number>((a, b) => a - b);
    treap = treap.add(50);
    treap = treap.add(30);
    treap = treap.add(70);
    treap = treap.add(20);
    treap = treap.add(40);
    treap = treap.add(60);
    treap = treap.add(80);
  });

  describe('at', () => {
    it('should retrieve elements in in-order', () => {
      expect(treap.at(0)).toBe(20);
      expect(treap.at(1)).toBe(30);
      expect(treap.at(2)).toBe(40);
      expect(treap.at(3)).toBe(50);
      expect(treap.at(4)).toBe(60);
      expect(treap.at(5)).toBe(70);
      expect(treap.at(6)).toBe(80);
    });

    it('should return undefined for out-of-bounds indices', () => {
      expect(treap.at(-1)).toBeUndefined();
      expect(treap.at(7)).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should retrieve the exact element from the treap', () => {
      expect(treap.get(20)).toBe(20);
      expect(treap.get(60)).toBe(60);
    });

    it('should return undefined if the element is not in the treap', () => {
      expect(treap.get(10)).toBeUndefined();
      expect(treap.get(100)).toBeUndefined();
    });
  });
});

describe('balance', () => {
  // test that we're reaonsably balanced after a bunch of adds and removes
  it('should be balanced after ordered adds', () => {});
  it('should be balanced after ordered removes', () => {});
  it('should be balanced after random adds', () => {});
  it('should be balanced after random removes', () => {});
});

describe('size', () => {
  it('returns correct size after only inserts', () => {
    let treap = new PersistentTreap<number>((a, b) => a - b);
    treap = treap.add(1);
    treap = treap.add(2);
    treap = treap.add(3);
    // console.log(inspect(treap, true, undefined));
    expect(treap.size).toBe(3);
  });
});

test('adding and removing does not break array indexing', () => {
  const SIZE = 100; // example size
  const values = [];
  let treap = new PersistentTreap<number>((a, b) => a - b);

  for (let i = 0; i < SIZE; ++i) {
    treap = treap.add(i);
    values.push(i);
  }

  const TRIALS = 4;
  for (let i = 0; i < SIZE; ++i) {
    for (let t = 0; t < TRIALS; ++t) {
      treap = treap.delete(i);
      for (let j = 0; j < treap.size; ++j) {
        if (j >= i) {
          expect(treap.at(j)).toBe(values[j + 1]);
        } else {
          expect(treap.at(j)).toBe(values[j]);
        }
      }
      treap = treap.add(i);
      for (let j = 0; j < treap.size; ++j) {
        expect(treap.at(j)).toBe(values[j]);
      }
    }
  }
});

test('getting an iterator', () => {
  let t = new PersistentTreap<number>((a, b) => a - b);
  t = t.add(10);
  t = t.add(5);
  t = t.add(15);
  t = t.add(2);
  expect([...t]).toEqual([2, 5, 10, 15]);
  const iter = t.iteratorAfter(6);
  expect(iter.next().value).toBe(10);
  expect(iter.next().value).toBe(15);
  const next = iter.next();
  expect(next.done).toBe(true);
  expect(next.value).toBe(undefined);
});

test('reverse iterating from the end', () => {
  let t = new PersistentTreap<number>((a, b) => a - b);
  t = t.add(10);
  t = t.add(5);
  t = t.add(15);
  t = t.add(2);
  const iter = t.reverseIterator();
  expect(iter.next().value).toBe(15);
  expect(iter.next().value).toBe(10);
  expect(iter.next().value).toBe(5);
  expect(iter.next().value).toBe(2);
  expect(iter.next().value).toBe(undefined);
});

test('getting a reverse iterator from a specific point', () => {
  let t = new PersistentTreap<number>((a, b) => a - b);
  t = t.add(10);
  t = t.add(5);
  t = t.add(15);
  t = t.add(2);
  const iter = t.iteratorBefore(6);
  expect(iter.next().value).toBe(5);
  expect(iter.next().value).toBe(2);
  expect(iter.next().value).toBe(undefined);
});

test('finding an index', () => {
  let t = new PersistentTreap<number>((a, b) => a - b);
  for (let i = 0; i < 10; ++i) {
    t = t.add(i);
  }
  for (let i = 0; i < 10; ++i) {
    const index = t.findIndex(i)!;
    expect(index).toBe(t.at(index));
    expect(index).toBe(i);
  }
  expect(t.findIndex(100)).toBe(undefined);
  expect(t.findIndex(-1)).toBe(undefined);
});
