/**
 * A sink which materializes the results into the DOM via DOM manipulation on diff.
 *
 * - We need a key function to extract a primitive key to identify the
 * node in the dom.
 * - A comparator to sort the nodes in the dom and do removals/insertions
 * - Maybe a map from key -> dom node to avoid searching?
 *  Map or sorted array. We'd want to navigate so we can append after items.
 * - The diffi-dataflow would be giving us actual DOM nodes
 *
 * Now.. how can we create a tree of diffi-dataflow results?
 * Reduce would somehow have to link into an existing diffi-dataflow pipeline
 * for that reduction.
 *
 * Or no reductions but sub-selects? A `map` that products a new diffi-dataflow
 * pipeline on a field which is a sub-select?
 *
 * The sink would have to see inside the results to understand it is a sub-select...
 *
 * So results are:
 * 1. DOM nodes
 * 2. Another differentaial dataflow pipeline which is sunk into a node at
 * its key position.
 * ^-- tear down is problematic. remove-re-add.
 */
import { Version } from "../core/types";
import { DifferenceStream } from "../core/graph/DifferenceStream";
import { Multiset } from "../core/multiset";

export class DOMSink<T extends Node, K extends string | number> {
  readonly #root;
  readonly #stream;
  readonly #keyFn;
  readonly #comparator;
  readonly #reader;
  readonly #nodeMapping: [K, T][] = [];

  constructor(
    root: Node,
    stream: DifferenceStream<T>,
    keyFn: (n: T) => K,
    comparator: (l: K, r: K) => number
  ) {
    this.#root = root;
    this.#stream = stream;
    this.#keyFn = keyFn;
    this.#comparator = comparator;
    this.#reader = this.#stream.newReader();
    const self = this;
    this.#reader.setOperator({
      run(version: Version) {
        self.#run(version);
      },
    });
  }

  #run(version: Version) {
    this.#reader.drain(version).forEach((collection) => {
      this.#sink(collection);
    });
  }

  #sink(collection: Multiset<T>) {
    // do the sinking
    // -- update our mutable array
    // -- update the DOM based on the mutable array change
  }

  destroy() {
    this.#stream.removeReader(this.#reader);
  }
  // TODO: for a remove followed by add, we should just move the node? well
  // only if the node is identical. For recursive structures we'll certainly
  // need a solution here. To understand if the stream is a new stream or
  // the stream just needs moving.
  // For composability the user likely wants streams within the thing
  // returning DOM nodes to this stream.
}

function sink() {}
