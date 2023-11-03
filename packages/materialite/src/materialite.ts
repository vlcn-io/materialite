import {
  ISourceInternal,
  MaterialiteForSourceInternal,
  Version,
} from "./core/types.js";
import { MutableMapSource } from "./sources/MutableMapSource.js";
import { SetSource } from "./sources/StatelessSetSource.js";
import { KeyFn } from "./sources/Source.js";
import { ImmutableSetSource } from "./sources/ImmutableSetSource.js";
import { Comparator } from "@vlcn.io/ds-and-algos/types";

export class Materialite {
  #version: Version;
  #dirtySources: Set<ISourceInternal> = new Set();

  #currentTx: Version | null = null;
  #internal: MaterialiteForSourceInternal;

  constructor() {
    this.#version = 0;
    const self = this;
    this.#internal = {
      addDirtySource(source) {
        self.#dirtySources.add(source);
        // auto-commit if not in a transaction
        if (self.#currentTx === null) {
          self.#currentTx = self.#version + 1;
          self.#commit();
        }
      },
    };
  }

  /**
   * A source that does not retain and values and
   * only sends them down the stream.
   * @returns
   */
  newStatelessSet<T>() {
    const ret = new SetSource<T>(this.#internal);
    return ret;
  }

  /**
   * A source that retains values in a versioned, immutable, and sorted data structure.
   *
   * 1. The retaining of values allows for late pipeline additions to receive all data they may have missed.
   * 2. The versioning allows for late pipeline additions to receive data from a specific point in time.
   * 3. Being sorted allows cheaper construction of the final materialized view on pipeline modification if the
   *   order of the view matches the order of the source.
   *
   * @param comparator
   * @returns
   */
  newImmutableSortedSet<T>(comparator: Comparator<T>) {
    const ret = new ImmutableSetSource<T>(this.#internal, comparator);
    return ret;
  }

  /**
   * A source that retains values in a mutable, sorted data structure.
   *
   * 1. The retaining of values allows for late pipeline additions to receive all data they may have missed.
   * 2. Being sorted allows cheaper construction of the final materialized view on pipeline modification if the
   *   order of the view matches the order of the source.
   */
  newSortedSet<T>(_comparator: Comparator<T>) {
    // a treap that is not persistent.
    // const ret = new
  }

  /**
   * A source that retains values in a mutable, unordered data structure.
   *
   * 1. The retaining of values allows for late pipeline additions to receive all data they may have missed.
   *
   * The fact that the source is unsorted means that we can build it faster than a sorted source. This is
   * useful where the source and view will not have the same ordering.
   *
   * If source and view will have the same order, use a sorted source.
   *
   * If many views will be created from the same source but with many different orderings,
   * use this source.
   *
   * @param getKey
   * @returns
   */
  newUnorderedSet<K, V>(getKey: KeyFn<V, K>) {
    const ret = new MutableMapSource<K, V>(this.#internal, getKey);
    return ret;
  }

  /**
   * Run the provided lambda in a transaciton.
   * Will be committed when the lambda exits
   * and all incremental computations that depend on modified inputs
   * will be run.
   *
   * An exception to this is in the case of nested transactions.
   * No incremental computation will run until the outermost transaction
   * completes.
   *
   * If the transaction throws, all pending inputs which were queued will be rolled back.
   * If a nested transaction throws, all transactions in the stack are rolled back.
   *
   * In this way, nesting transactions only exists to allow functions to be ignorant
   * of what transactions other functions that they call may create. It would be problematic
   * if creating transactions within transactions failed as it would preclude the use of
   * libraries that use transactions internally.
   */
  tx(fn: () => void) {
    if (this.#currentTx === null) {
      this.#currentTx = this.#version + 1;
    } else {
      // nested transaction
      // just run the function as we're already inside the
      // scope of a transaction that will handle rollback and commit.
      fn();
      return;
    }

    try {
      fn();
      this.#commit();
    } catch (e) {
      this.#rollback();
      throw e;
    } finally {
      this.#dirtySources.clear();
    }
  }

  #rollback() {
    this.#currentTx = null;
    for (const source of this.#dirtySources) {
      source.onRollback();
    }
  }

  #commit() {
    this.#version = this.#currentTx!;
    this.#currentTx = null;
    for (const source of this.#dirtySources) {
      source.onCommitPhase1(this.#version);
    }
    for (const source of this.#dirtySources) {
      source.onCommitPhase2(this.#version);
    }
  }
}

/*
import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { IThirdPartySource } from "./source/Source.js";

export class Materialite {
  constructor() {}

  // Create a new in-memory source
  newSource() {}

  // User provided source
  // If source.comparator matches comparator we can use source directly
  connect<T>(source: IThirdPartySource<T>, comparator: Comparator<T>) {}
}
*/
