export type OperatorMsg = {
  readonly _tag: "after";
  readonly cursor: unknown;
};

export type Msg = {
  readonly _tag: "pull";
  // readonly version: number;
  readonly operatorMessages: OperatorMsg[];
};
