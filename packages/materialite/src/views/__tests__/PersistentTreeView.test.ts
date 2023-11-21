import { expect, test } from "vitest";
import { Materialite } from "../../materialite.js";
import { Comparator } from "@vlcn.io/ds-and-algos/types";

const comp: Comparator<number> = (l, r) => l - r;
const m = new Materialite();
test("rematerialization", () => {
  const s = m.newSortedSet(comp);

  m.tx(() => {
    for (let i = 0; i < 15; ++i) {
      s.add(i);
    }
  });

  let numProcessed = 0;
  const processed: number[] = [];
  const view = s.stream
    .filter((x) => {
      processed.push(x);
      ++numProcessed;
      return true;
    })
    .materialize(comp, {
      wantInitialData: true,
      limit: 5,
    });

  expect(view.value.size).toBe(5);
  expect([...view.value]).toEqual([0, 1, 2, 3, 4]);
  // we process 7 because the view eagerly takes a few more items
  expect(numProcessed).toBe(7); // pulling w/ limit is lazy wrt upstream operators

  numProcessed = 0;
  processed.length = 0;
  const newView = view.rematerialize(10);
  expect(newView.value.size).toBe(10);
  expect([...newView.value]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  // prior view is unchanged
  expect([...view.value]).toEqual([0, 1, 2, 3, 4]);
  expect(numProcessed).toBe(8); // todo;

  view.destroy();
  numProcessed = 0;
  processed.length = 0;
  const finalView = newView.rematerialize(15);
  expect([...finalView.value]).toEqual([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  ]);
  expect(numProcessed).toBe(6);
});

// test("rematerialization with filtered stream", () => {});
