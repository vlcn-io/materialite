import { test, expect } from "vitest";
import { Materialite } from "../materialite.js";
import { ISource } from "../sources/Source.js";

const compareNums = (l: number, r: number) => l - r;
// TODO: test this for _computation branching not re-running_ and _notification branching not re-running_
test("late arrivals signal a pull to get old data.", () => {
  const m = new Materialite();

  runTest(m.newSortedSet<number>(compareNums));

  function runTest(source: ISource<number>) {
    let timesFourCount = 0;
    let timesTwoCount = 0;
    let timesSixCount = 0;

    m.tx(() => {
      source.add(1);
    });

    /*
         s
         |
         *2 (2)
        /  \
  (4) *2    *3 (6)
    */

    const timesTwo = source.stream
      .map((v) => v * 2)
      .effect(
        (_) => {
          timesTwoCount++;
        },
        { wantInitialData: false }
      );
    const timesFour = timesTwo
      .map((v) => v * 2)
      .effect(
        (_) => {
          timesFourCount++;
        },
        { wantInitialData: false }
      );
    const timesSix = timesTwo
      .map((v) => v * 3)
      .effect(
        (_) => {
          timesSixCount++;
        },
        { wantInitialData: false }
      );

    const timesFourMaterialized = timesFour.materialize(compareNums);
    expect([...timesFourMaterialized.value]).toEqual([4]);
    expect(timesFourCount).toBe(1);
    expect(timesTwoCount).toBe(1);
    // hmm.. maybe should be called? idk. it has an effect attached so those should also cause calling
    // yea, effects should pull
    expect(timesSixCount).toBe(0);

    // Times size should pull its branch and not the 4 branch
    // the 4 branch has already seen all old data
    const timesSixMaterialized = timesSix.materialize(compareNums);
    expect(timesFourCount).toBe(1);
    expect(timesTwoCount).toBe(2);
    expect(timesSixCount).toBe(1);
    expect([...timesFourMaterialized.value]).toEqual([4]);
    expect([...timesSixMaterialized.value]).toEqual([6]);
  }
});

test("late arrivals do not push new data down forks that do not want it", () => {
  const m = new Materialite();
  const source = m.newSortedSet<number>(compareNums);

  let v1Notified = null;
  let v2Notified = null;

  m.tx(() => {
    source.add(1);
    source.add(2);
  });

  // v1 does not ask for initial data
  const v1 = source.stream.materialize(compareNums, {
    wantInitialData: false,
    name: "v1",
  });
  // so it should be empty
  expect([...v1.value]).toEqual([]);
  v1.on((value) => {
    v1Notified = [...value];
  });

  // adding v2 shouldn't change v1
  const v2 = source.stream.materialize(compareNums, {
    wantInitialData: true,
    name: "v2",
  });
  v2.on((value) => {
    v2Notified = [...value];
  });
  expect([...v1.value]).toEqual([]);
  expect([...v2.value]).toEqual([1, 2]);

  // v2 shouldn't be notified -- value is set up before listener is registered
  expect(v2Notified).toBe(null);
  // v1 shouldn't be notified -- it lives on a separate branch than v2 who pulled for data
  expect(v1Notified).toBe(null);
});

// test("linear count", () => {});
