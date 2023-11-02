import { Source } from "../../sources/Source.js";
import { AbstractDifferenceStream } from "./AbstractDifferenceStream.js";
import { RootDifferenceStreamWriter } from "./DifferenceWriter.js";
import { Msg } from "./Msg.js";

export class RootDifferenceStream<T> extends AbstractDifferenceStream<T> {
  constructor(source: Source<unknown, unknown>) {
    super(new RootDifferenceStreamWriter<T>(source));
  }

  destroy(): void {
    this.writer.destroy();
  }

  pull(msg: Msg) {
    this.writer.pull(msg);
  }
}

/**
 * pull...
 *
 * changing writers but do we need to change readers too?
 *
 * source - w -
 */
