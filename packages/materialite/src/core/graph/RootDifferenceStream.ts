import { Source } from "../../sources/Source.js";
import { AbstractDifferenceStream } from "./AbstractDifferenceStream.js";
import { RootDifferenceStreamWriter } from "./DifferenceWriter.js";
import { Msg } from "./Msg.js";

export class RootDifferenceStream<T> extends AbstractDifferenceStream<T> {
  // We either have a _source_ or _operator_ off of which this stream comes.
  readonly #source: Source<unknown, unknown>;

  constructor(source: Source<unknown, unknown>) {
    super(new RootDifferenceStreamWriter<T>());
    this.#source = source;
  }

  destroy(): void {
    // remove all readers from the writer?
    this.writer.removeAllReaders();
  }

  pull(msg: Msg) {
    this.writer.handlePullMsg(msg);
    if (this.#source._state === "stateful") {
      // TODO: possible to recompute only down the branch that requested recomputation?
      this.#source.resendAll(msg);
    }
  }
}
