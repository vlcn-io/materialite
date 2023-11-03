import { AbstractDifferenceStream } from "./AbstractDifferenceStream.js";
import { DifferenceStreamWriter } from "./DifferenceWriter.js";
import { Hoisted } from "./Msg.js";

export class DifferenceStream<T> extends AbstractDifferenceStream<T> {
  constructor() {
    super(new DifferenceStreamWriter<T>());
  }

  pull(msg: Hoisted) {
    this.writer.pull(msg);
  }

  protected newStream<X>(): AbstractDifferenceStream<X> {
    return new DifferenceStream();
  }
}
