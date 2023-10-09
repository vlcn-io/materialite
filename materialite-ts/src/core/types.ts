export type Version = number;
export interface ISourceInternal {
  onCommitPhase1(): void;
  onCommitPhase2(): void;
  onRollback(): void;
}
export type MaterialiteForSourceInternal = {
  readonly version: Version;
  addDirtySource(source: ISourceInternal): void;
};
