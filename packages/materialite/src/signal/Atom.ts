import {
  ISourceInternal,
  MaterialiteForSourceInternal,
  Version,
} from "../core/types.js";
import { IDerivation, ISignal } from "./ISignal.js";

export class Atom<T> implements ISignal<T> {
  #pending: T | undefined;
  #value: T;

  readonly #internal: ISourceInternal;
  readonly #materialite;
  readonly #listeners = new Set<(value: T, version: number) => void>();
  readonly #derivations = new Set<IDerivation<T>>();

  constructor(materialite: MaterialiteForSourceInternal, v: T) {
    this.#value = v;
    this.#materialite = materialite;
    const self = this;
    // These are only called if the atom was changed in the transaction
    this.#internal = {
      onCommitPhase1(_: Version) {
        if (self.#pending !== undefined) {
          self.#value = self.#pending;
          self.#pending = undefined;
        }
      },
      onCommitPhase2(v: Version) {
        for (const d of self.#derivations) {
          d.onSignalChanged(self.#value, v);
        }
      },
      onCommitted(v: Version) {
        for (const l of self.#listeners) {
          l(self.#value, v);
        }
        for (const d of self.#derivations) {
          d.onCommitted(self.#value, v);
        }
      },
      onRollback() {
        self.#pending = undefined;
      },
    };
  }

  _derive(derivation: IDerivation<T>): () => void {
    this.#derivations.add(derivation);
    return () => {
      this.#derivations.delete(derivation);
    };
  }

  on(fn: (value: T, version: number) => void): () => void {
    this.#listeners.add(fn);
    return () => {
      this.#listeners.delete(fn);
    };
  }

  off(fn: (value: T, version: number) => void): void {
    this.#listeners.delete(fn);
  }

  destroy() {
    this.#listeners.clear();
    this.#derivations.clear();
  }

  get data() {
    return this.#value;
  }

  set data(v: T) {
    if (v === this.#value) {
      return;
    }
    this.#pending = v;
    this.#materialite.addDirtySource(this.#internal);
  }
}
