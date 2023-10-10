import {
  ISourceInternal,
  MaterialiteForSourceInternal,
  Version,
} from "./core/types";
import { SetSource } from "./sources/SetSource";

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
          self.#commit();
        }
      },
    };
  }

  newArray() {}
  newSet<T>(initialData?: Iterable<T>) {
    const ret = new SetSource<T>(this.#internal);
    if (initialData !== undefined) {
      ret.addAll(initialData);
    }
    return ret;
  }
  newMap() {}

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
      this.#currentTx = ++this.#version;
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
