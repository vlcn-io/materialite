import { makeTuple2 } from "@vlcn.io/datastructures-and-algos/tuple";
import { DifferenceStream } from "../core/graph/DifferenceStream";
import { Entry, JoinableValue, Multiset } from "../core/multiset";
import { ISourceInternal, MaterialiteForSourceInternal } from "../core/types";
import { Version } from "../core/types";

export class MapSource<K, V> {
  readonly #materialite: MaterialiteForSourceInternal;
  #pending: Entry<JoinableValue<K, V>>[] = [];
  readonly #stream;
  readonly #internal: ISourceInternal;
  readonly #map = new Map<K, V>();
  #tempMap = new Map<K, V>();

  constructor(materialite: MaterialiteForSourceInternal) {
    this.#materialite = materialite;
    this.#stream = new DifferenceStream<JoinableValue<K, V>>(true);
    const self = this;

    this.#internal = {
      onCommitPhase1(version: Version) {
        self.#tempMap = new Map();
        self.#stream.queueData([version, new Multiset(self.#pending)]);
        for (const [[k, v], mult] of self.#pending) {
          if (mult === -1) {
            self.#map.delete(k);
          } else {
            self.#map.set(k, v);
          }
        }
        self.#pending = [];
      },
      onCommitPhase2(version: Version) {
        self.#stream.notify(version);
      },
      onRollback() {
        self.#pending = [];
      },
    };
  }

  // TODO: inspect join index growth
  set(k: K, v: V) {
    this.#set(k, v);
    this.#materialite.addDirtySource(this.#internal);
  }

  #set(k: K, v: V) {
    const existing = this.#map.get(k) || this.#tempMap.get(k);
    if (existing !== undefined) {
      this.#pending.push([makeTuple2([k, existing]), -1]);
    } else {
      this.#tempMap.set(k, v);
    }
    this.#pending.push([makeTuple2([k, v]), 1]);
    // do not mark dity here as it may auto-commit on bulk operations
    // that are in progress
  }

  extend(entries: Iterable<readonly [K, V]>) {
    for (const [k, v] of entries) {
      this.#set(k, v);
    }
    this.#materialite.addDirtySource(this.#internal);
  }

  delete(k: K) {
    const existing = this.#map.get(k) || this.#tempMap.get(k);
    if (existing !== undefined) {
      this.#pending.push([makeTuple2([k, existing]), -1]);
      this.#tempMap.delete(k);
      this.#materialite.addDirtySource(this.#internal);
    }
  }

  clear() {
    for (const [k, v] of this.#map) {
      this.#pending.push([makeTuple2([k, v]), -1]);
    }
    for (const [k, v] of this.#tempMap) {
      this.#pending.push([makeTuple2([k, v]), -1]);
    }
    this.#materialite.addDirtySource(this.#internal);
  }
}
