import { describe, beforeEach, it, expect } from "vitest";
import { PersistentTreap } from "../PersistentTreap.js";
import { inspect } from "util";

describe("PersistentTreap", () => {
  let treap: PersistentTreap<number>;

  beforeEach(() => {
    treap = new PersistentTreap<number>((a, b) => a - b);
  });

  it("should add values correctly", () => {
    treap = treap.add(10);
    treap = treap.add(5);
    treap = treap.add(15);
    expect(treap.toArray()).toEqual([5, 10, 15]);
  });

  it("should check for contained values", () => {
    treap = treap.add(10);
    expect(treap.contains(10)).toBe(true);
    expect(treap.contains(15)).toBe(false);
  });

  // TODO: via comparator so we can actually test
  it("should replace value if it exists", () => {
    treap = treap.add(10);
    treap = treap.add(5);

    // Replacing existing value
    const newTreap = treap.add(10);

    expect(newTreap.contains(10)).toBe(true);
    expect(treap !== newTreap).toBe(true); // Ensure it's a new instance
  });

  it("should remove values correctly", () => {
    treap = treap.add(10);
    treap = treap.add(5);
    treap = treap.delete(10);
    expect(treap.contains(10)).toBe(false);
    expect(treap.toArray()).toEqual([5]);
  });

  it("should map, filter, and reduce correctly", () => {
    treap = treap.add(10);
    treap = treap.add(5);
    treap = treap.add(15);
    expect(treap.map((value) => value * 2)).toEqual([10, 20, 30]);
    expect(treap.filter((value) => value > 10)).toEqual([15]);
    expect(treap.reduce((acc, value) => acc + value, 0)).toBe(30);
  });
});

describe("Get operations", () => {
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

  describe("at", () => {
    it("should retrieve elements in in-order", () => {
      expect(treap.at(0)).toBe(20);
      expect(treap.at(1)).toBe(30);
      expect(treap.at(2)).toBe(40);
      expect(treap.at(3)).toBe(50);
      expect(treap.at(4)).toBe(60);
      expect(treap.at(5)).toBe(70);
      expect(treap.at(6)).toBe(80);
    });

    it("should return null for out-of-bounds indices", () => {
      expect(treap.at(-1)).toBeNull();
      expect(treap.at(7)).toBeNull();
    });

    // test that at works as expected after constructing a treap and
    // performing adds and removes
    it("should retrieve elements in in-order after adds and removes", () => {});
  });

  describe("get", () => {
    it("should retrieve the exact element from the treap", () => {
      expect(treap.get(20)).toBe(20);
      expect(treap.get(60)).toBe(60);
    });

    it("should return null if the element is not in the treap", () => {
      expect(treap.get(10)).toBeNull();
      expect(treap.get(100)).toBeNull();
    });
  });
});

describe("size", () => {
  it("returns correct size after only inserts", () => {
    let treap = new PersistentTreap<number>((a, b) => a - b);
    treap = treap.add(1);
    treap = treap.add(2);
    treap = treap.add(3);
    console.log(inspect(treap, true, null));
    expect(treap.length).toBe(3);
  });
});
