// Copyright (c) 2023 One Law LLC

import util from "util";

export function inspect(e: any) {
  console.log(util.inspect(e, false, null, true));
}
