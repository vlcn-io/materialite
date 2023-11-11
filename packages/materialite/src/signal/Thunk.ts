import { Version } from "../core/types.js";
import { ISignal } from "./ISignal.js";

export class Thunk<TRet, TSignals extends ISignal<unknown>[]>
  implements ISignal<TRet>
{
  private readonly signals;
  private readonly listeners = new Set<
    (value: TRet, version: Version) => void
  >();
  #lastVersion = -1;
  #pendingInputs;

  constructor(private readonly f: (...args: TSignals) => TRet, ...s: TSignals) {
    this.signals = s;
  }

  get data(): TRet {
    return this.f(...this.signals);
  }

  #onSignalChange = (version: Version) => {
    if (version <= this.#lastVersion) {
      return;
    }
    this.#lastVersion = version;
    this.#notify(this.data);
  };

  #notify(d: TRet) {
    for (const listener of this.listeners) {
      // do not call data here. Only want to compute once
      // rather than for each listener
      listener(d);
    }
  }

  on(fn: (value: TRet, version: Version) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.off(fn);
    };
  }

  off(fn: (value: TRet, version: Version) => void): void {
    this.listeners.delete(fn);
  }

  destroy() {
    for (const s of this.signals) {
      s.off(this.#onSignalChange);
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
