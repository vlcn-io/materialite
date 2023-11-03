import { Treap } from "@vlcn.io/ds-and-algos/Treap";
import { StatefulSetSource } from "./StatefulSetSource.js";
import { MaterialiteForSourceInternal } from "../core/types.js";
import { Comparator } from "immutable";

export class MutableSetSource<T> extends StatefulSetSource<T> {
  constructor(
    materialite: MaterialiteForSourceInternal,
    comparator: Comparator<T>
  ) {
    super(materialite, comparator, (comparator) => new Treap(comparator));
  }
}
