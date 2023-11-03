// extends AbstractDifferenceStream
// hoistable ops return hoistable streams

import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { AbstractDifferenceStream } from "./AbstractDifferenceStream.js";
import { DifferenceStreamWriter } from "./DifferenceWriter.js";
import { HoistableAfterOperator } from "./ops/HoistableAfterOperator.js";
import { DifferenceStream } from "./DifferenceStream.js";

export class HoistableDifferenceStream<T> extends AbstractDifferenceStream<T> {
  protected newStream<X>(): AbstractDifferenceStream<X> {
    return new DifferenceStream();
  }

  after(v: T, comparator: Comparator<T>): HoistableDifferenceStream<T> {
    const ret = new HoistableDifferenceStream(new DifferenceStreamWriter<T>());
    new HoistableAfterOperator<T>(
      this.writer.newReader(),
      ret.writer,
      v,
      comparator
    );
    return ret;
  }

  // take is hoistable but returns non-hoistable
  // filter is hoistable if given info
  // e.g., filter('key', 'op', value);
}
