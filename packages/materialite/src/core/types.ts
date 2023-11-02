// Copyright (c) 2023 One Law LLC

export type Version = number;
export interface ISourceInternal {
  onCommitPhase1(version: Version): void;
  onCommitPhase2(version: Version): void;
  onRollback(): void;
}
export type MaterialiteForSourceInternal = {
  addDirtySource(source: ISourceInternal): void;
};
export type DestroyOptions = { autoCleanup?: boolean };
