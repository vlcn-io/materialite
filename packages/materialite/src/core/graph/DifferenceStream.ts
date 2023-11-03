import { Materialite } from "../../materialite.js";
import { AbstractDifferenceStream } from "./AbstractDifferenceStream.js";
import { DifferenceStreamWriter } from "./DifferenceWriter.js";
import { Hoisted } from "./Msg.js";

export class DifferenceStream<T> extends AbstractDifferenceStream<T> {
  constructor(materialite: Materialite) {
    super(materialite, new DifferenceStreamWriter<T>());
  }

  pull(msg: Hoisted) {
    this.writer.pull(msg);
  }

  protected newStream<X>(): AbstractDifferenceStream<X> {
    return new DifferenceStream(this.materialite);
  }
}
