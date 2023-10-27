import { DifferenceStream } from "../index.js";

export type Source<T, CT> = IForgetfulSource<T> | IMemorableSource<T, CT>;

export interface ISource<T> {
  readonly type: "stateful" | "stateless";
  readonly stream: DifferenceStream<T>;
  /**
   * Detaches all pipelines from this source.
   * This is the nuclear option to clean up all pipelines derived from the same source.
   *
   * The composable and more subtle way is to destroy the views or streams that are derived from this source.
   * Once a stream has no more readers, it will destroy itself.
   *
   * deatchPipelines isn't generally recommended as it prevents composition.
   * Someone down the line may have forked the stream and attached their own pipeline
   * which this would prematurely kill.
   *
   * Killing pipelines at their terminus, rather than source, is the recommended way.
   */
  detachPipelines(): void;
  add(v: T): void;
  delete(v: T): void;
}

export interface IForgetfulSource<T> extends ISource<T> {
  readonly type: "stateless";
}

export interface IMemorableSource<T, CT> extends ISource<T> {
  readonly type: "stateful";
  readonly data: CT;
  recomputeAll(): this;
}
