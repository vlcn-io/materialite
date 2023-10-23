// import { test } from "vitest";
// import { PersistentTreap } from "../PersistentTreap.js";
// import { inspect } from "util";

// test("scratch", () => {
//   let t = new PersistentTreap<number>((l, r) => l - r);
//   const s = new Set();

//   t = t.add(-100000000);
//   t = t.add(-100000000);
//   t = t.add(-100000001);
//   s.add(-100000000);
//   s.add(-100000001);

//   // console.log(inspect(t, true, null));

//   console.log(t.at(0));
//   console.log(t.at(1));
//   console.log([...s.values()].sort((l: number, r: number) => l - r));

//   console.log(t.length);
// });
