// Top level APIs
export { Materialite } from "./materialite.js";
export { AbstractDifferenceStream as DifferenceStream } from "./core/graph/AbstractDifferenceStream.js";
export { ISignal } from "./signal/ISignal.js";
export { IDifferenceStream } from "./core/graph/IDifferenceStream.js";

// Sources
export { SetSource } from "./sources/StatelessSetSource.js";
export { ImmutableSetSource as PersistentSetSource } from "./sources/ImmutableSetSource.js";
export { MutableMapSource } from "./sources/MutableMapSource.js";
export type {
  IStatefulSource as IMemorableSource,
  ISource,
} from "./sources/Source.js";

// Views
export { ValueView as PrimitiveView } from "./views/PrimitiveView.js";
export { PersistentTreeView } from "./views/PersistentTreeView.js";

// Re-Exports
export { PersistentTreap } from "@vlcn.io/ds-and-algos/PersistentTreap";
