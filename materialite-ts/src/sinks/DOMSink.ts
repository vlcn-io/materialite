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
 *
 * Maybe everything is fine. Just return a node that itself has a differential
 * dataflow stream going on but is sunk to a DOMSink.
 */
import { Version } from "../core/types.js";
import { DifferenceStream } from "../core/graph/DifferenceStream.js";
import { Multiset } from "../core/multiset.js";
import { binarySearch } from "@vlcn.io/datastructures-and-algos/binary-search";

export class DOMSink<T extends Node, K> {
  readonly #root;
  readonly #stream;
  readonly #comparator;
  readonly #reader;
  readonly #nodeMapping: (readonly [K, T])[] = [];
  readonly #destructor?: (k: K) => void;

  constructor(
    root: Node,
    stream: DifferenceStream<readonly [K, T]>,
    comparator: (l: readonly [K, T], r: readonly [K, T]) => number,
    destructor?: (k: K) => void
  ) {
    this.#root = root;
    this.#stream = stream;
    this.#comparator = comparator;
    this.#reader = this.#stream.newReader();
    const self = this;
    this.#destructor = destructor;
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

  #sink(collection: Multiset<readonly [K, T]>) {
    // do the sinking
    // -- update our mutable array
    // -- update the DOM based on the mutable array change
    for (const entry of collection.entries) {
      let [val, mult] = entry;
      console.log(entry);
      const idx = binarySearch(this.#nodeMapping, val, this.#comparator);
      console.log(this.#nodeMapping);
      console.log(idx);
      if (mult > 0) {
        this.#addAll(val, mult, idx);
      } else if (mult < 0 && idx !== -1) {
        this.#removeAll(val, Math.abs(mult), idx);
      }
    }
  }

  #addAll(val: readonly [K, T], mult: number, idx: number) {
    while (mult > 0) {
      if (idx < 0) {
        const pos = Math.abs(idx) - 1;
        if (pos === 0) {
          this.#root.insertBefore(val[1], this.#root.firstChild!);
          this.#nodeMapping.unshift(val);
        } else if (pos === this.#nodeMapping.length) {
          this.#root.appendChild(val[1]);
          this.#nodeMapping.push(val);
        } else {
          this.#root.insertBefore(val[1], this.#nodeMapping[pos]![1]);
          this.#nodeMapping.splice(pos, 0, val);
        }
      } else {
        this.#root.insertBefore(val[1], this.#nodeMapping[idx]![1]);
        this.#nodeMapping.splice(idx, 0, val);
      }
      mult -= 1;
    }
  }

  #removeAll(val: readonly [K, T], mult: number, idx: number) {
    // TODO: wind back to least idx
    while (mult > 0) {
      const elem = this.#nodeMapping[idx];
      if (elem === undefined || this.#comparator(elem, val) !== 0) {
        break;
      }
      this.#root.removeChild(elem[1]);
      if (this.#destructor) {
        this.#destructor(elem[0]);
      }
      this.#nodeMapping.splice(idx, 1);
      mult -= 1;
    }
  }

  destroy() {
    this.#stream.removeReader(this.#reader);
  }
}
