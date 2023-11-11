export interface ISignal<T> {
  on(fn: (value: T, version: number) => void): () => void;
  off(fn: (value: T, version: number) => void): void;
  // get data(): T;
}
