import { AbstractDifferenceStream } from "./AbstractDifferenceStream.js";
import { DifferenceStreamReader } from "./DifferenceReader.js";
import {
  DifferenceStreamWriter,
  RootDifferenceStreamWriter,
} from "./DifferenceWriter.js";
import { Msg } from "./Msg.js";
import { IOperator } from "./ops/Operator.js";

/**
 * A difference stream represents a stream of differences.
 *
 * A new stream is created by applying an operator to an existing stream.
 *
 * A difference stream technically represents the output of a source or operator
 * but it does know if its upstream operator and the inputs to this operator.
 *
 * in1  |
 *  \   |
 *   op - out ->
 *  /   |
 * in2  |
 *
 *
 * In other words, the stream is everything to the right of the line but the stream
 * does know of everything to the left of the line. A stream knows its upstreams.
 *
 * This is to facilitate passing messages from the end of a stream back up
 * to the source.
 *
 * This message passing is required for cases when operators and/or views are attached
 * to a stream after the stream has already been activated. In those cases we need to
 * tell the source to send down historical values.
 *
 * The message passing is also required in order to facilitate cleanup. If there are no more consumers for an operator
 * or view we should destroy it. This would in turn destroy its upstreams if they have no more consumers.
 *
 * Finally, messaging passing is also needed for cases when the `source` is sorted. We can leverage sorted
 * sources by passing them the arguments to an `after` operator during re-computation.
 *
 * A stream will only ever have one operator and one output.
 * It can have any number of inputs to that operator, however.
 *
 * An alternate implementation would be for streams to only know of their operator,
 * pass the message to the operator, operator passes message to its upstream input.
 */
export class DifferenceStream<T> extends AbstractDifferenceStream<T> {
  readonly #operator: IOperator | null;
  // Keep track of upstreams so when we destroy this stream
  // we can remove ourselves from our upstreams and then that stream,
  // if it has no more consumers, can destroy itself.
  readonly #upstreams: readonly [
    AbstractDifferenceStream<unknown>,
    DifferenceStreamReader<unknown>
  ][];

  constructor(
    upstreams: readonly [
      AbstractDifferenceStream<unknown>,
      DifferenceStreamReader<unknown>
    ][],
    opCtor: (w: DifferenceStreamWriter<T>) => IOperator
  ) {
    super(new RootDifferenceStreamWriter<T>());
    // TODO: rather than all these invariants we should just have two kinds of DifferenceStreams
    // One that is a stream off a source
    // Another that is a stream off an operator.
    this.#upstreams = upstreams;
    this.#operator = opCtor(this.writer);
  }

  destroy() {
    // remove ourselves from our upstreams
    for (const [upstream, reader] of this.#upstreams) {
      upstream.removeReader(reader);
    }
  }

  pull(msg: Msg) {
    this.writer.pull(msg);
    for (const [upstream, _] of this.#upstreams) {
      const opMsg = this.#operator?.pull();
      if (opMsg != null) {
        msg.operatorMessages.push(opMsg);
      }
      upstream.pull(msg);
    }
  }
}
