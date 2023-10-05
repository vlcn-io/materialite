import { expect, test } from "vitest";
import { GraphBuilder } from "../differential/dataflow/differential-dataflow";
import { Multiset } from "../differential/multiset";

test("dataflow graph from example", () => {
  const graphBuilder = new GraphBuilder();
  const [inputA, inputAWriter] = graphBuilder.newInput<number>();
  const computationStep = inputA
    .map((x: number) => x + 5)
    .filter((d) => d % 2 === 0)
    .debug();

  const graph = graphBuilder.build();

  for (const x of Array.from({ length: 10 }, (_, i) => i)) {
    console.log(`Sending ${x}`);
    inputAWriter.sendData(new Multiset([[x, 1]]));
    graph.step();
  }

  console.log(
    Array.from({ length: 10 }, (_, i) => i)
      .map((x) => x + 5)
      .filter((d) => d % 2 === 0)
  );
});

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
