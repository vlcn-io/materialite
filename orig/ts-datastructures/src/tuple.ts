const tupleSymbol = Symbol("tupleSymbol");
const joinResultSymbol = Symbol("joinResultSymbol");

export function makeTuple<T extends readonly any[]>(x: T): T {
  Object.defineProperty(x, tupleSymbol, {
    value: true,
    writable: false,
    enumerable: false,
  });
  return x;
}

export function makeTuple2<T1, T2>(x: [T1, T2]): Tuple2<T1, T2> {
  Object.defineProperty(x, tupleSymbol, {
    value: true,
    writable: false,
    enumerable: false,
  });
  return x as any;
}

export function isTuple<T extends readonly any[]>(x: T): boolean {
  return Array.isArray(x) && (x as any)[tupleSymbol] === true;
}

export type Tuple2<T1, T2> = readonly [T1, T2] & { [tupleSymbol]: true };
export type Tuple<T> = readonly T[] & { [tupleSymbol]: true };
export type TupleVariadic<T extends readonly any[]> = [...T] & {
  [tupleSymbol]: true;
};
export type JoinResult<T> = readonly T[] & {
  [joinResultSymbol]: true;
  [tupleSymbol]: true;
};
export type JoinResultVariadic<T extends readonly any[]> = readonly [...T] & {
  [joinResultSymbol]: true;
  [tupleSymbol]: true;
};

export function joinResult<T extends readonly any[]>(
  x: T
): JoinResultVariadic<T> {
  Object.defineProperty(x, tupleSymbol, {
    value: true,
    writable: false,
    enumerable: false,
  });
  Object.defineProperty(x, joinResultSymbol, {
    value: true,
    writable: false,
    enumerable: false,
  });
  return x as any;
}

export function isJoinResult<T>(x: T): boolean {
  return Array.isArray(x) && (x as any)[joinResultSymbol] === true;
}
