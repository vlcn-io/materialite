import { ITransaction } from "./db/ITransaction";

export class Materialite {
  constructor() {}

  async tx(
    outerTx: ITransaction | null,
    fn: (tx: ITransaction) => Promise<void>
  ) {
    // create tx object
  }
}
