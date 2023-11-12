import { expect, test } from "vitest";
import { Materialite } from "../materialite.js";

test("Atom emits on change", () => {
  const m = new Materialite();
  const a = m.newAtom(1);

  let count = 0;
  let value = 0;
  a.on((v) => {
    count++;
    value = v;
  });

  // listeners are not notified until a change
  expect(count).toBe(0);

  // notified on change
  a.value = 2;
  expect(count).toBe(1);
  expect(value).toBe(2);

  m.tx(() => {
    a.value = 3;
    // not notified until tx commit
    expect(count).toBe(1);
    expect(value).toBe(2);
  });
  expect(count).toBe(2);
  expect(value).toBe(3);
});

test("Thunk can take many inputs", () => {
  const m = new Materialite();
  const a = m.newAtom(1);
  const b = m.newAtom(2);
  const c = m.newAtom(3);

  const t = m.compute((a: number, b: number, c: number) => a + b + c, a, b, c);

  let count = 0;
  let value = t.value;
  t.on((v) => {
    count++;
    value = v;
  });

  expect(value).toBe(6);
  expect(count).toBe(0);

  m.tx(() => {
    a.value = 2;
    b.value = 3;
    c.value = 4;
    expect(value).toBe(6);
    expect(count).toBe(0);
  });
  expect(value).toBe(9);
  expect(count).toBe(1);
});

test("no notifications if values do not change", () => {
  const m = new Materialite();
  const a = m.newAtom(1);

  let count = 0;
  let value = a.value;
  a.on((v) => {
    count++;
    value = v;
  });

  a.value = 1;
  expect(count).toBe(0);
  expect(value).toBe(1);
});

test("eager cleanup", () => {
  const m = new Materialite();
  const a = m.newAtom(1);

  let count = 0;
  const fn = (v: number) => {
    ++count;
    return v + 1;
  };
  const final = a.pipe(fn).pipe(fn).pipe(fn);
  const off = final.on(() => {});

  expect(final.value).toBe(4);
  expect(count).toBe(3);

  // TODO: off should take options about eager cleanup
  off();

  // TODO: If we don't eager cleanup how do we clean the graph? :|
  // Finalization registries?
  // Weak refs to things in theh graph? hmm.. middle nodes won't be held.
  // No clean unless explicit destroy called?
  a.value = 2;
  expect(count).toBe(3);

  m.compute;
});

test("eager cleanup doesn't prune used branaches", () => {});

// test thunks / composition of many signals into a single computed value
// test materialized views as signals
// test de-materialization?
// test atoms
