export interface ISignal<T> {
  on(fn: (value: T) => void): () => void;
  off(fn: (value: T) => void): void;
  get data(): T;
}
