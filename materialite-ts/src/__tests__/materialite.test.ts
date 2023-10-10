import { test } from "vitest";
import { Materialite } from "../materialite";
import util from "util";

function inspect(e: any) {
  console.log(util.inspect(e, false, null, true));
}

test("Materialite#setSource", () => {
  const materialite = new Materialite();
  const set = materialite.newSet<number>();

  set.stream.map((v) => v + 1).debug((v) => inspect(v));
  set.add(1);
  set.add(1);
  set.delete(1);
});
