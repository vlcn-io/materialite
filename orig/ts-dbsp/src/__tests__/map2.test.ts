import { expect, test } from "vitest";
import Map2 from "map2";

test("map2 behaves as we expect for single value entries", () => {
  const map = new Map2<number, number | undefined, number>();
  map.set(1, undefined, 1);
  map.set(2, undefined, 2);
  map.set(3, undefined, 3);
  expect(map.get(1, undefined)).toBe(1);
  expect(map.get(2, undefined)).toBe(2);
  expect(map.get(3, undefined)).toBe(3);

  map.delete(2, undefined);
  expect(map.get(2, undefined)).toBe(undefined);

  map.set(1, 1, 1);
  map.set(1, 2, 2);
  map.set(1, 3, 3);
  expect(map.get(1, 1)).toBe(1);
  expect(map.get(1, 2)).toBe(2);
  expect(map.get(1, 3)).toBe(3);

  map.clear();
  expect([...map.entries()]).toEqual([]);
});
