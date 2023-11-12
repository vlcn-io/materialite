export interface ISignal<T> {
  // TODO: move these to an internal interface
  _derive(derivation: IDerivation<T>): () => void;

  on(fn: (value: T, version: number) => void): () => void;
  /**
   * If there are 0 listeners left after removing the given listener,
   * the signal is destroyed.
   *
   * To opt out of this behavior, pass `autoCleanup: false`
   * @param listener
   */
  off(
    fn: (value: T, version: number) => void,
    options?: { autoCleanup?: boolean }
  ): void;
  get value(): T;

  pipe<R>(f: (v: T) => R): ISignal<R>;
}

export interface IDerivation<T> {
  onSignalChanged(value: T, version: number): void;
  onCommitted(value: T, version: number): void;
}
