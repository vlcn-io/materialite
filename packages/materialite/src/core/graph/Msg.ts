/*
 * To facilitate Materialite's ability to use actual databases as sources,
 * these messages are passed down to the source from operators.
 *
 * This is a similar idea to Aphrodite where each
 * operator also had information to pass down to
 * "source expressions". The source expression could use that information
 * to hoist operations to the DB.
 *
 * See: https://tantaman.com/2022-05-26-query-planning.html
 */
export type OperatorMsg = AfterMsg<unknown>;

export type AfterMsg<T> = {
  readonly _tag: "after";
  readonly cursor: T;
  readonly comparator: (a: T, b: T) => number;
};

export type TakMsg = {
  readonly _tag: "take";
  readonly count: number;
};

export type Msg = {
  readonly _tag: "pull";
  // readonly version: number;
  readonly operatorMessages: OperatorMsg[];
};
