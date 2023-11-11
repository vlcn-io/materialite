// Copyright (c) 2023 One Law LLC

import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { Materialite } from "../materialite.js";

export type Version = number;
export interface ISourceInternal {
  // Add values to queues
  onCommitPhase1(version: Version): void;
  // Drain queues and run the reactive graph
  // TODO: we currently can't rollback a transaction in phase 2
  onCommitPhase2(version: Version): void;
  // Now that the graph has computed itself fully, notify effects / listeners
  onCommitted(version: Version): void;
  onRollback(): void;
}
export type MaterialiteForSourceInternal = {
  readonly materialite: Materialite;
  addDirtySource(source: ISourceInternal): void;
};
export type DestroyOptions = { autoCleanup?: boolean };

export type EventMetadata =
  | {
      cause: "full_recompute";
      comparator?: Comparator<unknown>;
    }
  | {
      cause: "difference";
    };
