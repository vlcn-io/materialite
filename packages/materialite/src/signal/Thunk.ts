import { Version } from "../core/types.js";
import { IDerivation, ISignal } from "./ISignal.js";

export class Thunk<T extends any[], TRet> implements ISignal<TRet> {
  private readonly signals;
  private readonly listeners = new Set<
    (value: TRet, version: Version) => void
  >();
  private readonly derivations = new Set<IDerivation<TRet>>();
  private lastValue: TRet | undefined = undefined;

  #lastVersion = -1;
  #pendingInputs: any[] = [];
  #pendingInputsCount = 0;
  #pendingInputsVersion = -1;
  #notifiedListenersVersion = -1;
  readonly #unlisten: (() => void)[] = [];

  constructor(
    private readonly f: (...args: { [K in keyof T]: T[K] }) => TRet,
    ...s: { [K in keyof T]: ISignal<T[K]> }
  ) {
    this.signals = s;
    this.#pendingInputs;
    const self = this;
    for (let i = 0; i < s.length; i++) {
      const signal = s[i]!;
      this.#unlisten.push(
        signal._derive({
          onSignalChanged(v, version) {
            self.#onSignalChange(i, v, version);
          },
          onCommitted(v, version) {
            self.#notifyCommitted(v, version);
          },
        })
      );
    }

    this.lastValue = this.f(...(s.map((s) => s.value) as any));
  }

  get value() {
    return this.lastValue!;
  }

  pipe<R>(f: (v: TRet) => R): ISignal<R> {
    return new Thunk((v) => f(v), this);
  }

  combine<To extends any[], R>(
    f: (a: TRet, ...args: { [K in keyof To]: To[K] }) => R,
    ...s: { [K in keyof To]: ISignal<To[K]> }
  ) {
    return new Thunk(f, this, ...s);
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
      const newValue = this.f(...(this.#pendingInputs as any));
      if (newValue !== this.lastValue) {
        this.lastValue = newValue;
        this.#notify(newValue, version);
      } else {
        // if the values did not change, we don't need to notify
        // either downstream computations or commit listeners.
        this.#notifiedListenersVersion = version;
      }
    }
  }

  #notify(d: TRet, version: Version) {
    for (const derivation of this.derivations) {
      derivation.onSignalChanged(d, version);
    }
  }

  #notifyCommitted(_: any, version: Version) {
    // TODO: test that we only notify once per committed tx
    if (version === this.#notifiedListenersVersion) {
      return;
    }
    this.#notifiedListenersVersion = version;
    for (const listener of this.listeners) {
      listener(this.value, version);
    }
    for (const derivation of this.derivations) {
      derivation.onCommitted(this.value, version);
    }
    // have to notify derivations too.
    // that's the only way they get the commit notification is if it is passed down
    // the graph.
  }

  _derive(d: IDerivation<TRet>): () => void {
    this.derivations.add(d);
    return () => {
      this.derivations.delete(d);
      this.#maybeCleanup(true);
    };
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
    this.#maybeCleanup(options.autoCleanup || false);
  }

  destroy() {
    for (const u of this.#unlisten) {
      u();
    }
  }

  #maybeCleanup(autoCleanup: boolean, isNextTick = false) {
    if (autoCleanup && !isNextTick) {
      // Give the user a chance to attach listeners in the current tick
      // before auto-cleaning
      setTimeout(() => {
        this.#maybeCleanup(autoCleanup, true);
      }, 0);
      return;
    }

    if (
      autoCleanup &&
      this.listeners.size === 0 &&
      this.derivations.size === 0
    ) {
      this.destroy();
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
