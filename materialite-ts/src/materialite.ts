import { ISourceInternal, Version } from "./core/types";

export class Materialite {
  #version: Version;

  // weak refs to created sources
  // so on-commit we can iterate our sources and release their queues
  // maybe a list of `dirty sources` kept for the tx so we don't have to iterate all sources
  #dirtySources: Set<ISourceInternal> = new Set();

  constructor() {
    this.#version = 0;
  }

  newArray() {}
  newSet() {}
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
  tx(fn: () => void) {}
}
