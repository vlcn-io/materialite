import { expect, test } from "vitest";
import { DifferenceStreamWriter } from "../graph";
import { Multiset } from "../../multiset";

test("drain drains in the right order", () => {
  const writer = new DifferenceStreamWriter();
  const reader = writer.newReader();

  writer.sendData(new Multiset([[1, 1]]));
  writer.sendData(new Multiset([[2, 1]]));
  const drained = reader.drain();
  expect(drained[0]!.entries).toEqual([[1, 1]]);
  expect(drained[1]!.entries).toEqual([[2, 1]]);
});
