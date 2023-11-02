// extends AbstractDifferenceStream
// hoistable ops return hoistable streams

import { AbstractDifferenceStream } from "./AbstractDifferenceStream.js";
import { DifferenceStreamWriter } from "./DifferenceWriter.js";
import { Msg } from "./Msg.js";

export class HoistableDifferenceStream<T> extends AbstractDifferenceStream<T> {
  pull(msg: Msg) {
    this.writer.pull(msg);
  }

  protected newStream<X>(): AbstractDifferenceStream<X> {
    return new HoistableDifferenceStream(new DifferenceStreamWriter<X>());
  }

  // a hoistable After to start.
}
