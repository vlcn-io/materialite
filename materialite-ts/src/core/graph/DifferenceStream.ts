import { DifferenceStreamWriter } from "./graph";

export class DifferenceStream<T> {
  readonly #writer;
  constructor() {
    // set write to a new difference stream writer
    this.#writer = new DifferenceStreamWriter<T>();
  }
}
