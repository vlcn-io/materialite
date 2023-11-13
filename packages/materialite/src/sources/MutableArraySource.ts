import { RootDifferenceStream } from "../core/graph/RootDifferenceStream.js";
import { Entry } from "../core/multiset.js";
import {
  ISourceInternal,
  MaterialiteForSourceInternal,
} from "../core/types.js";
import { IStatefulSource, IUnsortedSource } from "./Source.js";

export class MutableArraySource<T>
  implements
    IStatefulSource<[number, T], T[]>,
    IUnsortedSource<[number, T], number>
{
  readonly _state = "stateful";
  readonly _sort = "unsorted";
  readonly #listeners = new Set<(data: [number, T][]) => void>();
  readonly #materialite: MaterialiteForSourceInternal;
  readonly #internal: ISourceInternal;

  #stream: RootDifferenceStream<[number, T]>;
  #pending: Entry<[number, T]>[] = [];
  #recomputeAll = false;
  #array: T[];

  constructor(materialite: MaterialiteForSourceInternal) {
    this.#materialite = materialite;
    this.#stream = new RootDifferenceStream<[number, T]>(
      materialite.materialite,
      this
    );
    this.#array = [];
  }

  get value() {
    return this.#array;
  }

  push(v: T): void {}
}
