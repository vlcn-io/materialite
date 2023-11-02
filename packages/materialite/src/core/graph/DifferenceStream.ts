import { AbstractDifferenceStream } from "./AbstractDifferenceStream.js";
import { DifferenceStreamWriter } from "./DifferenceWriter.js";
import { Msg } from "./Msg.js";

export class DifferenceStream<T> extends AbstractDifferenceStream<T> {
  constructor() {
    super(new DifferenceStreamWriter<T>());
  }

  destroy() {
    this.writer.destroy();
  }

  pull(msg: Msg) {
    this.writer.pull(msg);
  }
}
