import { test, expect } from "vitest";
import { Materialite } from "../materialite.js";
import { ISource } from "../sources/Source.js";

const compareNums = (l, r) => l - r;
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
      .effect((_) => {
        timesTwoCount++;
      });
    const timesFour = timesTwo
      .map((v) => v * 2)
      .effect((_) => {
        timesFourCount++;
      });
    const timesSix = timesTwo
      .map((v) => v * 3)
      .effect((_) => {
        timesSixCount++;
      });

    const timesFourMaterialized = timesFour.materialize(compareNums);
    timesFourMaterialized.pull();
    expect([...timesFourMaterialized.data]).toEqual([4]);
    expect(timesFourCount).toBe(1);
    expect(timesTwoCount).toBe(1);
    // hmm.. maybe should be called? idk. it has an effect attached so those should also cause calling
    expect(timesSixCount).toBe(1);

    // Times size should pull its branch and not the 4 branch
    // the 4 branch has already seen all old data
    timesSix.materialize(compareNums).pull();
    expect(timesFourCount).toBe(1);
    expect(timesTwoCount).toBe(2);
    expect(timesSixCount).toBe(2);
  }
});

test("late arrivals do not push new data down forks that do not want it", () => {});

test("linear count", () => {});
