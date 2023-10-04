import { expect, test } from 'vitest'
import { mergeSort } from "../sorting";
import { AttrNum, TypeNum } from '../../client/schema/Schema';

test('mergeSort', () => {
  const left = [1, 3, 5, 7, 9].map((v) => [[0 as TypeNum, 0 as AttrNum, v] as const, v] as const);
  const right = [2, 4, 6, 8, 10].map((v) => [[0 as TypeNum, 0 as AttrNum, v] as const, v] as const);
  const ret = mergeSort(left, right);
  expect(ret).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});
