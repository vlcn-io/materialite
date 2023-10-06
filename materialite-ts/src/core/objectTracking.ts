const TAG = Symbol("tag");
let id = 0;

export function objectId(v: Object) {
  if ((v as any)[TAG] === undefined) {
    Object.defineProperty(v, TAG, {
      value: ++id,
      writable: false,
      enumerable: false,
    });
  }

  return (v as any)[TAG];
}
