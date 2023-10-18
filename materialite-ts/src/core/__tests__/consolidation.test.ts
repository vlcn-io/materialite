import { test, expect } from "vitest";
import { comparator } from "../consolidation.js";
import { makeTuple } from "@vlcn.io/datastructures-and-algos/tuple";

test("tuple compare", () => {
  const t1 = makeTuple([1, 2, 3] as const);
  const t2 = makeTuple([1, 2, 3] as const);

  expect(comparator(t1, t2)).toBe(0);

  const t3 = makeTuple([1, 2, 3, 4] as const);
  expect(comparator(t1, t3)).toBe(-1);
  expect(comparator(t3, t1)).toBe(1);

  const t4 = makeTuple([1, 2, 4] as const);
  expect(comparator(t1, t4)).toBe(-1);
  expect(comparator(t4, t1)).toBe(1);

  const t5 = makeTuple([1, 2, 2] as const);
  expect(comparator(t1, t5)).toBe(1);
  expect(comparator(t5, t1)).toBe(-1);
});

test("tuple compare nested", () => {
  const t1 = makeTuple([1, makeTuple([2, 3])] as const);
  const t2 = makeTuple([1, makeTuple([2, 3])] as const);

  expect(comparator(t1, t2)).toBe(0);

  const t3 = makeTuple([1, makeTuple([2, 3, 4])] as const);
  expect(comparator(t1, t3)).toBe(-1);
  expect(comparator(t3, t1)).toBe(1);

  const t4 = makeTuple([1, makeTuple([2, 4])] as const);
  expect(comparator(t1, t4)).toBe(-1);
  expect(comparator(t4, t1)).toBe(1);

  const t5 = makeTuple([1, makeTuple([2, 2])] as const);
  expect(comparator(t1, t5)).toBe(1);
  expect(comparator(t5, t1)).toBe(-1);
});

test("object compare", () => {
  const o1 = { a: 1, b: 2 };
  expect(comparator(o1, o1)).toBe(0);
  const o2 = { a: 1, b: 2 };
  // o2 created second, has greater ID
  expect(comparator(o1, o2)).toBe(-1);
  expect(comparator(o2, o1)).toBe(1);
});

test("array compare", () => {
  const a1 = [1, 2, 3];
  expect(comparator(a1, a1)).toBe(0);
  const a2 = [1, 2, 3];
  // a2 created second, has greater ID
  expect(comparator(a1, a2)).toBe(-1);
  expect(comparator(a2, a1)).toBe(1);
});

test("mixed compare", () => {
  const o1 = { a: 1, b: 2 };
  const a1 = [1, 2, 3];
  expect(comparator(o1, a1)).toBe(-1);
  expect(comparator(a1, o1)).toBe(1);

  const bi1 = BigInt(1);
  expect(comparator(o1, bi1)).toBe(1);
  expect(comparator(bi1, o1)).toBe(-1);
});
