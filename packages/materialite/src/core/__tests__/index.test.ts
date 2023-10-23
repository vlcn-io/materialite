import { expect, test } from "vitest";
import { Index } from "../index.js";

test("add and get", () => {
  const index = new Index<number, string>();
  index.add(1, ["foo", 1]);
  index.add(2, ["bar", 1]);
  index.add(1, ["baz", 1]);
  expect(index.get(1)).toEqual([
    ["foo", 1],
    ["baz", 1],
  ]);
  expect(index.get(2)).toEqual([["bar", 1]]);
});

test("join", () => {
  const index1 = new Index<number, string>();
  index1.add(1, ["foo", 1]);
  index1.add(2, ["bar", 1]);
  index1.add(1, ["baz", 1]);

  const index2 = new Index<number, string>();
  index2.add(1, ["foo", 1]);
  index2.add(2, ["bar", 1]);
  index2.add(1, ["baz", 1]);

  const joined = index1.join(index2);
  expect(joined.entries).toEqual([
    [["foo", "foo"], 1],
    [["foo", "baz"], 1],
    [["baz", "foo"], 1],
    [["baz", "baz"], 1],
    [["bar", "bar"], 1],
  ]);
});

test("compact", () => {
  const index = new Index<number, string>();
  index.add(1, ["foo", 1]);
  index.add(1, ["foo", 1]);
  index.add(1, ["foo", 1]);
  index.add(2, ["bar", 1]);
  index.add(2, ["bar", -1]);

  index.compact();
  expect(index.get(1)).toEqual([["foo", 3]]);
  expect(index.get(2)).toEqual([]);
});

test("extend", () => {
  const index1 = new Index<number, string>();
  index1.add(1, ["foo", 1]);
  index1.add(2, ["bar", 1]);
  index1.add(1, ["baz", 1]);
  const index2 = new Index<number, string>();
  index2.add(1, ["foo", 1]);
  index2.add(2, ["bar", 1]);
  index2.add(1, ["baz", 1]);
  index1.extend(index2);
  expect(index1.get(1)).toEqual([
    ["foo", 1],
    ["baz", 1],
    ["foo", 1],
    ["baz", 1],
  ]);
  expect(index1.get(2)).toEqual([
    ["bar", 1],
    ["bar", 1],
  ]);
});
