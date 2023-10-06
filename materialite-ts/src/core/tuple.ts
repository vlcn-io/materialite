const tupleSymbol = Symbol("tupleSymbol");

export function tagTuple<T extends []>(x: T): T {
  (x as any)[tupleSymbol] = true;
  return x;
}

export function isTuple<T extends []>(x: T): boolean {
  return (x as any)[tupleSymbol] === true;
}
