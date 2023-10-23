import { test, expect } from "vitest";
import { TuplableMap } from "../TuplableMap.js";
import { makeTuple } from "../tuple.js";

// test that it behaves like a normal map

test("TuplableMap#delete", () => {
  const map = new TuplableMap<number, number>();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  expect(map.size).toBe(N);

  for (let i = 0; i < N; i++) {
    expect(map.get(i)).toBe(i);
  }

  for (let i = 0; i < N; i++) {
    map.delete(i);
  }

  expect(map.size).toBe(0);
  expect(map.get(0)).toBe(undefined);
});

test("TuplableMap#entries", () => {
  const map = new TuplableMap<number, number>();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  let i = 0;
  for (const [key, value] of map.entries()) {
    expect(key).toBe(i);
    expect(value).toBe(i);
    i++;
  }
});

test("TuplableMap#forEach", () => {
  const map = new TuplableMap<number, number>();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  let i = 0;
  map.forEach((value, key) => {
    expect(key).toBe(i);
    expect(value).toBe(i);
    i++;
  });
});

test("TuplableMap#get", () => {
  const map = new TuplableMap<number, number>();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  for (let i = 0; i < N; i++) {
    expect(map.get(i)).toBe(i);
  }
});

test("TuplableMap#getWithDefault", () => {
  const map = new TuplableMap<number, number>();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    expect(map.getWithDefault(i, i)).toBe(i);
  }

  for (let i = 0; i < N; i++) {
    expect(map.get(i)).toBe(i);
  }

  expect(map.get(N + 10)).toBe(undefined);
});

test("TuplableMap#has", () => {
  const map = new TuplableMap<number, number>();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    expect(map.has(i)).toBe(false);
  }

  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  for (let i = 0; i < N; i++) {
    expect(map.has(i)).toBe(true);
  }
});

test("TuplableMap#keys", () => {
  const map = new TuplableMap<number, number>();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  let i = 0;
  for (const key of map.keys()) {
    expect(key).toBe(i);
    i++;
  }
});

test("TuplableMap#set", () => {
  const map = new TuplableMap<number, number>();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    expect(map.set(i, i)).toBe(map);
  }

  for (let i = 0; i < N; i++) {
    expect(map.get(i)).toBe(i);
  }
});

test("TuplableMap#values", () => {
  const map = new TuplableMap<number, number>();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  let i = 0;
  for (const value of map.values()) {
    expect(value).toBe(i);
    i++;
  }
});

test("TuplableMap#iterator", () => {
  const map = new TuplableMap<number, number>();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  let i = 0;
  for (const [key, value] of map) {
    expect(key).toBe(i);
    expect(value).toBe(i);
    i++;
  }
});

test("TuplableMap#clear", () => {
  const map = new TuplableMap<number, number>();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }
  expect(map.size).toBe(N);

  map.clear();
  expect(map.size).toBe(0);
});

// test that it works with tuples as keys
test("TuplableMap#delete", () => {
  const map = new TuplableMap<[number, number], number>();
  const N = 5;
  for (let i = 0; i < N; i++) {
    map.set(makeTuple([i, i]), i);
  }

  expect(map.size).toBe(N);

  for (let i = 0; i < N; i++) {
    expect(map.get(makeTuple([i, i]))).toBe(i);
  }

  for (let i = 0; i < N; i++) {
    map.delete(makeTuple([i, i]));
  }

  expect(map.size).toBe(0);
  expect(map.get(makeTuple([0, 0]))).toBe(undefined);
});

// test recursive tuples
test("TuplableMap#delete#recursive", () => {
  type Node = [number, number, [number, number]];
  const map = new TuplableMap<Node, number>();
  const N = 5;
  for (let i = 0; i < N; i++) {
    map.set(makeTuple([i, i, makeTuple([i, i])]), i);
  }

  expect(map.size).toBe(N);

  for (let i = 0; i < N; i++) {
    expect(map.get(makeTuple([i, i, makeTuple([i, i])]))).toBe(i);
  }

  for (let i = 0; i < N; i++) {
    map.delete(makeTuple([i, i, makeTuple([i, i])]));
  }

  expect(map.size).toBe(0);
  expect(map.get(makeTuple([0, 0, makeTuple([0, 0])]))).toBe(undefined);
});
