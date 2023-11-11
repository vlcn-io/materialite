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
// test thunks / composition of many signals into a single computed value
// test materialized views as signals
// test de-materialization?
// test atoms
