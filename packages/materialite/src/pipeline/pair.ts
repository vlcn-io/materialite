import { PersistentSetSource } from "../sources/ImmutableSetSource.js";
import { View } from "../views/View.js";

export class Pair<S, V, VCT> {
  constructor(
    private readonly source: PersistentSetSource<S>,
    private readonly view: View<V, VCT>
  ) {}

  latestData() {
    return {
      source: this.source.data,
      view: this.view.data,
    };
  }
}

export function pair<S, V, VCT>(
  source: PersistentSetSource<S>,
  view: View<V, VCT>
) {
  return new Pair<S, V, VCT>(source, view);
}
