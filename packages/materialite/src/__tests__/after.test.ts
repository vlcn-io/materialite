import { expect, test } from "vitest";
import { Materialite } from "../materialite.js";

test("after on a stateful source. After is pushed to the source.", () => {
  const m = new Materialite();
  let comparisonCount = 0;
  const comp = (l: number, r: number) => {
    comparisonCount++;
    return l - r;
  };
  const otherComp = (l: number, r: number) => {
    comparisonCount++;
    return l - r;
  };
  const s = m.newSortedSet<number>(comp);

  m.tx(() => {
    for (let i = 0; i < 10_000; ++i) {
      s.add(i);
    }
  });

  console.log(comparisonCount);
  const originalCompareCount = comparisonCount;

  // TODO: we can exclude the requirement of a comparator
  // when we're chained off of sorted sets....
  let effectRuns = 0;
  const collection: number[] = [];
  s.stream.after(9_900, comp).effect((v) => {
    ++effectRuns;
    collection.push(v);
  });

  expect(comparisonCount - originalCompareCount).toBeLessThan(200);
  expect(effectRuns).toBe(99);
  const expected: number[] = [];
  for (let i = 9901; i < 10_000; ++i) {
    expected.push(i);
  }
  expect(collection).toEqual(expected);

  s.stream.after(9_900, otherComp).effect((_v) => {});
  console.log(comparisonCount);
  // If we don't use the same comparator we don't know we can use
  // the source set ordering for `after` and thus we have to sort the entire set.
  expect(comparisonCount - originalCompareCount).toBeGreaterThan(10_000);

  // add to the set
  // create a pipeline with after
  // test that the after is pushed to the source (how do dis?)
});

// test materialization of after has the right values

// test hoisting .. that after isn't hoisted too deeply down the query path. if it is it can break branches that
// did not request after
