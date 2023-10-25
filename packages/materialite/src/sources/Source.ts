import { DifferenceStream } from "../index.js";

export interface ISource<T> {
  readonly stream: DifferenceStream<T>;
  detachPipelines(): void;
  add(v: T): void;
  delete(v: T): void;
}

export interface IMemorableSource<T, CT> extends ISource<T> {
  readonly data: CT;
  recomputeAll(): this;
}
