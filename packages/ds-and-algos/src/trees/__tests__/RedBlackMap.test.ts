import { test, expect } from "vitest";
import { RBMap } from "../RedBlackMap.js";
import { ConcurrentModificationException } from "../../Error.js";

// Test the RBMap that it behaves like a regular Map

test("RBMap#delete", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
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

test("RBMap#entries", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
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

test("RBMap#forEach", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
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

test("RBMap#get", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  for (let i = 0; i < N; i++) {
    expect(map.get(i)).toBe(i);
  }
});

test("RBMap#getWithDefault", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  for (let i = 0; i < N; i++) {
    expect(map.getWithDefault(i, -1)).toBe(i);
  }

  for (let i = 0; i < N; i++) {
    expect(map.getWithDefault(i + N, -1)).toBe(-1);
  }
});

test("RBMap#has", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  for (let i = 0; i < N; i++) {
    expect(map.has(i)).toBe(true);
  }

  for (let i = 0; i < N; i++) {
    expect(map.has(i + N)).toBe(false);
  }
});

test("RBMap#keys", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
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

test("RBMap#set", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
  const N = 1000;
  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  for (let i = 0; i < N; i++) {
    expect(map.get(i)).toBe(i);
  }
});

test("RBMap#values", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
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

test("RBMap#iterator", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
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

test("RBMap#iterator#remove", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
  const N = 1000;

  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  let i = 0;
  for (const [key, value] of [...map]) {
    expect(key).toBe(i);
    expect(value).toBe(i);
    map.delete(key);
    i++;
  }

  expect(map.size).toBe(0);
});

test("Concurrent modification exception thrown if modified during iteration", () => {
  const map = new RBMap<number, number>((a, b) => a - b);
  const N = 5;

  for (let i = 0; i < N; i++) {
    map.set(i, i);
  }

  expect(() => {
    for (const [key, _] of map) {
      map.delete(key);
    }
  }).toThrow(ConcurrentModificationException);
});
