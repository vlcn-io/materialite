const tupleSymbol = Symbol("tupleSymbol");
const joinResultSymbol = Symbol("joinResultSymbol");

export function makeTuple<T extends readonly any[]>(x: T): T {
  (x as any)[tupleSymbol] = true;
  return x;
}

export function isTuple<T extends readonly any[]>(x: T): boolean {
  return Array.isArray(x) && (x as any)[tupleSymbol] === true;
}

export type Tuple2<T1, T2> = readonly [T1, T2] & { [tupleSymbol]: true };

export function makeJoinResult<T extends readonly any[]>(x: T): T {
  (x as any)[joinResultSymbol] = true;
  (x as any)[tupleSymbol] = true;
  return x;
}
