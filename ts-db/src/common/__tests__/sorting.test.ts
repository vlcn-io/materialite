import { expect, test } from "vitest";
import { mergeSort } from "../sorting.js";
import { AttrNum, TypeNum } from "../../client/schema/Schema.js";

test("mergeSort", () => {
  const left = [1, 3, 5, 7, 9].map(
    (v) => [[0 as TypeNum, 0 as AttrNum, v] as const, v] as const
  );
  const right = [2, 4, 6, 8, 10].map(
    (v) => [[0 as TypeNum, 0 as AttrNum, v] as const, v] as const
  );
  const ret = mergeSort(left, right);
  expect(ret).toEqual([
    [[0, 0, 1], 1],
    [[0, 0, 2], 2],
    [[0, 0, 3], 3],
    [[0, 0, 4], 4],
    [[0, 0, 5], 5],
    [[0, 0, 6], 6],
    [[0, 0, 7], 7],
    [[0, 0, 8], 8],
    [[0, 0, 9], 9],
    [[0, 0, 10], 10],
  ]);
});
