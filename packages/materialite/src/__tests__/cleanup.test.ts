import { test, expect } from "vitest";
import { Materialite } from "../materialite.js";

test("cleaning up the only user of a stream cleans up the entire pipeline", () => {
  const materialite = new Materialite();
  const set = materialite.newSet<number>();

  let notifyCount = 0;
  const final = set.stream
    .debug((_) => notifyCount++)
    .debug((_) => notifyCount++)
    .debug((_) => notifyCount++);

  set.add(1);
  expect(notifyCount).toBe(3);
  final.destroy();
  set.add(2);
  // stream was cleaned up, all the way to the root
  // so no more notifications.
  expect(notifyCount).toBe(3);
});

test("cleaning up the only user of a stream cleans up the entire pipeline but stops at a used fork", () => {
  const materialite = new Materialite();
  const set = materialite.newSet<number>();

  let notifyCount = 0;
  const stream1 = set.stream.debug((_) => notifyCount++);
  const stream2 = stream1.debug((_) => notifyCount++);
  const stream3 = stream1.debug((_) => notifyCount++);
  // Forked stream which creates this graph:
  /*
      stream1
      /      \
  stream2   stream3
  */

  set.add(1);
  expect(notifyCount).toBe(3);
  stream3.destroy();
  set.add(2);
  // stream was cleaned up to fork, so still 2 notification
  expect(notifyCount).toBe(5);
  stream2.destroy();
  set.add(3);
  // stream was cleaned up, all the way to the root
  // so no more notifications.
  expect(notifyCount).toBe(5);
});
