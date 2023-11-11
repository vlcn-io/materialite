import { Version } from "../core/types.js";
import { ISignal } from "./ISignal.js";

export class Thunk<T extends any[], TRet> implements ISignal<TRet> {
  private readonly signals;
  private readonly listeners = new Set<
    (value: TRet, version: Version) => void
  >();
  private lastValue: TRet | undefined = undefined;

  #lastVersion = -1;
  #pendingInputs: any[];
  #pendingInputsCount = 0;
  #pendingInputsVersion = -1;
  readonly #unlisten: (() => void)[];

  constructor(
    private readonly f: (...args: { [K in keyof T]: T[K] }) => TRet,
    ...s: { [K in keyof T]: ISignal<T[K]> }
  ) {
    this.signals = s;
    this.#pendingInputs;
    for (let i = 0; i < s.length; i++) {
      const signal = s[i]!;
      this.#unlisten.push(
        signal.on((v, version) => {
          this.#onSignalChange(i, v, version);
        })
      );
    }
  }

  get data() {
    return this.lastValue!;
  }

  #onSignalChange(i: number, value: any, version: number) {
    if (version <= this.#lastVersion) {
      console.warn("received stale data");
      return;
    }
    if (this.#pendingInputsCount === 0) {
      this.#pendingInputsVersion = version;
    } else {
      if (this.#pendingInputsVersion !== version) {
        console.warn("received data from different versions for the same tick");
        return;
      }
    }
    this.#pendingInputs[i] = value;
    this.#pendingInputsCount++;
    if (this.#pendingInputsCount === this.signals.length) {
      this.#lastVersion = version;
      this.#pendingInputsCount = 0;
      this.lastValue = this.f(...(this.#pendingInputs as any));
      this.#notify(this.lastValue, version);
    }
  }

  #notify(d: TRet, version: Version) {
    for (const listener of this.listeners) {
      // do not call `data` here. Only want to compute once
      // rather than for each listener
      listener(d, version);
    }
  }

  on(fn: (value: TRet, version: Version) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.off(fn);
    };
  }

  /**
   * If there are 0 listeners left after removing the given listener,
   * the signal is destroyed.
   *
   * To opt out of this behavior, pass `autoCleanup: false`
   * @param listener
   */
  off(
    fn: (value: TRet, version: Version) => void,
    options: { autoCleanup?: boolean } = { autoCleanup: true }
  ): void {
    this.listeners.delete(fn);
    if (options.autoCleanup && this.listeners.size === 0) {
      this.destroy();
    }
  }

  destroy() {
    for (const u of this.#unlisten) {
      u();
    }
  }
}

// function foo<T extends any[], R>(
//   f: (...args: { [K in keyof T]: T[K] }) => R,
//   ...argProviders: { [K in keyof T]: { data: T[K] } }
// ): R {
//   const args = argProviders.map((s) => s.data);
//   return f(...(args as any));
// }

// function bar(a: string, b: number): string {
//   return a + b;
// }

// foo(bar, { data: "" }, { data: 2 });
