import { expect, test } from "vitest";
import { TMap } from "../TMap";

test("setting and getting", () => {
  const map = new TMap();
  map.set([1, 2], "foo");
  expect(map.get([1, 2])).toBe("foo");

  map.set(1, "bar");
  expect(map.get(1)).toBe("bar");
});

test("entries", () => {
  const map = new TMap();
  map.set([1, 2], "foo");
  map.set(1, "bar");
  expect(map.entries()).toEqual([
    [[1, 2], "foo"],
    [1, "bar"],
  ]);
});

test("keys", () => {
  const map = new TMap();
  map.set([1, 2], "foo");
  map.set(1, "bar");
  expect(map.keys()).toEqual([[1, 2], 1]);
});

test("values", () => {
  const map = new TMap();
  map.set([1, 2], "foo");
  map.set(1, "bar");
  expect(map.values()).toEqual(["foo", "bar"]);
});
