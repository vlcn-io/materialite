import { ISource } from "./ISource";
import { ITransactionInternal } from "./ITransaction.js";

export class Transaction implements ITransactionInternal {
  constructor(
    public readonly parent: ITransactionInternal | null,
    public readonly txid: number
  ) {}

  commit(): void {
    // commit all sources
  }

  rollback(): void {
    // rollback all sources
  }

  addModifiedSource(source: ISource<unknown>): void {
    // add modified source
  }
}
