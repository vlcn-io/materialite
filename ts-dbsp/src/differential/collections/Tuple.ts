const tupleSymbol = Symbol("tupleSymbol");

export function tag<T>(x: T): T {
  (x as any)[tupleSymbol] = true;
  return x;
}

export function isTuple<T>(x: T): boolean {
  return Array.isArray(x) && (x as any)[tupleSymbol] === true;
}
