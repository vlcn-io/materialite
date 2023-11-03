import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { Hoisted } from "../core/graph/Msg.js";
import { RootDifferenceStream } from "../core/graph/RootDifferenceStream.js";

export type Source<T, K = T, CT = unknown> =
  | (IStatelessSource<T> & ISortedSource<T>)
  | (IStatelessSource<T> & IUnsortedSource<T, K>)
  | (IStatefulSource<T, CT> & ISortedSource<T>)
  | (IStatefulSource<T, CT> & IUnsortedSource<T, K>);
export type KeyFn<T, K> = (v: T) => K;

export interface ISource<T> {
  readonly _state: "stateful" | "stateless";
  readonly _sort: "sorted" | "unsorted";
  readonly stream: RootDifferenceStream<T>;
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

export interface ISortedSource<T> extends ISource<T> {
  readonly comparator: Comparator<T>;
  readonly _sort: "sorted";
}

export interface IUnsortedSource<T, K> extends ISource<T> {
  readonly keyFn: KeyFn<T, K>;
  readonly _sort: "unsorted";
}

export interface IStatelessSource<T> extends ISource<T> {
  readonly _state: "stateless";
}

export interface IStatefulSource<T, CT> extends ISource<T> {
  readonly _state: "stateful";
  readonly data: CT;
  resendAll(msg: Hoisted): this;
}

// TODO: we need to understand if the ordering by which
// we need data from the source matches the ordering of the
// source.
// TODO: do we allow dupes in a third party source or only unique values?
// TODO: if only unique, comparator must be able to distinguish between
// two values that are equal and not the same identity.
export interface IThirdPartySource<T> {
  onAdd(): void;
  onDelete(): void;
  // onReplace(): void;

  /**
   * The comparator that is used to sort the source.
   * If the source is already sorted by this comparator
   * we can avoid doing full scans over the source.
   *
   * The comparator must first compare by the ordering criteria
   * and then, if ordering criteria is equal, by primary key
   * of the data.
   *
   * @param a
   * @param b
   * @returns
   */
  readonly comparator: Comparator<T>;
  scan(options: {
    from?: T;
    limit?: number;
    direction?: "asc" | "desc";
  }): Iterable<T>;
}

// export interface ISource<T> {
//   add(x: T): void;
//   remove(x: T): void;

//   readonly stream: DifferenceStream<T>;
// }
