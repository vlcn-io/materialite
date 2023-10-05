import { expect, test } from "vitest";
import { GraphBuilder } from "../differential/dataflow/differential-dataflow";
import { Multiset } from "../differential/multiset";

test("dataflow graph from example", () => {
  const graphBuilder = new GraphBuilder();
  const [inputA, inputAWriter] = graphBuilder.newInput<number>();
  inputA
    .map((x: number) => x + 5)
    .filter((d) => d % 2 === 0)
    .debug((c) => console.log(c.entries));

  const graph = graphBuilder.build();

  for (const x of Array.from({ length: 10 }, (_, i) => i)) {
    console.log(`Sending ${x}`);
    inputAWriter.sendData(new Multiset([[x, 1]]));
    graph.step();
  }

  // console.log(
  //   Array.from({ length: 10 }, (_, i) => i)
  //     .map((x) => x + 5)
  //     .filter((d) => d % 2 === 0)
  // );
});

type Record = [number, string];
test("incremental joining", () => {
  const graphBuilder = new GraphBuilder();
  const [inputA, inputAWriter] = graphBuilder.newInput<Record>();
  const [inputB, inputBWriter] = graphBuilder.newInput<Record>();

  inputA.join(inputB).debug((c) => {
    console.log("[");
    for (const e of c.entries) {
      console.log(e);
    }
    console.log("]");
  });
  const graph = graphBuilder.build();

  const recordsA = [
    [1, "Aa"],
    [2, "Ab"],
    [3, "Ac"],
  ] as Record[];
  const recordsB = [
    [1, "Ba"],
    [2, "Bb"],
    [3, "Bc"],
  ] as Record[];
  for (let i = 0; i < recordsA.length; i++) {
    inputAWriter.sendData(new Multiset([[recordsA[i]!, 1]]));
    inputBWriter.sendData(new Multiset([[recordsB[i]!, 1]]));
    graph.step();
  }
});

/**
 * So what we have above is a stream processor that takes a stream of numbers.
 *
 * Now if we want to process a table the entries of which can be mutated over time such that
 * we should map those specific entries...
 *
 * These need index values attached to them? So we can reconstitute the table?
 *
 * The whole above thing could have been built way more simply given
 * it just takes a new number and applies a pipeline.
 *
 * There's no need for multisets or anything like that.
 *
 * What's our use case that we needed a solution to this problem?
 *   A query over a large dataset that can be mutated over time.
 *    Try that case out.
 */

// TODO: write a reactive graph that steps on transaction commit.
// and allows transaction rollback? So we can arrange all values then step?
// as in if the graph is reactive, we can just push values into it and it will
// step itself. But if we want to arrange all values then step, we need to
// support transactions.

// also need to check that we can flatten out joins of joins

// and check perf of all this

// and check what final output looks like. Can we get a view of the final output?
// I.e., a collection with all elements?
// Or should we just do DOM maniuplations directly? for the UI fwrk.
// -- composable components...

// inspect for how much work is actually taking place on each incremental push
