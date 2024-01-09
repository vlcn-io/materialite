import { ISource } from "./ISource.js";

export interface ITransaction {
  // track diry sources
  // track wals?
  // track parent tx if any
  // sources can use transaction object to determine where to write and read
  readonly parent: ITransaction | null;
  readonly txid: number;

  addModifiedSource(source: ISource<unknown>): void;
}

export interface ITransactionInternal extends ITransaction {
  commit(): void;
  rollback(): void;
}
