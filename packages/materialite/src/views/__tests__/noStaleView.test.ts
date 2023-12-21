import { expect, test } from "vitest";
import { Materialite } from "../../materialite.js";

test("Attaching a new view then immeidately asking for its value returns the most up to date value", () => {
  const materialite = new Materialite();
  const comparator = (l: number, r: number) => l - r;
  const set = materialite.newSortedSet<number>(comparator);
  set.add(1);
  set.add(2);
  set.add(3);

  const view = set.stream.map((v) => v + 1).materialize(comparator);
  expect([...view.value]).toEqual([2, 3, 4]);
});
