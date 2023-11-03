// Copyright (c) 2023 One Law LLC

import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { Materialite } from "../materialite.js";

export type Version = number;
export interface ISourceInternal {
  onCommitPhase1(version: Version): void;
  onCommitPhase2(version: Version): void;
  onRollback(): void;
}
export type MaterialiteForSourceInternal = {
  readonly materialite: Materialite;
  addDirtySource(source: ISourceInternal): void;
};
export type DestroyOptions = { autoCleanup?: boolean };

export type EventMetadata = (
  | {
      cause: "full_recompute";
      comparator?: Comparator<unknown>;
    }
  | {
      cause: "difference";
    }
) & { version: Version };
