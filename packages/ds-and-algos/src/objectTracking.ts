// Copyright (c) 2023 One Law LLC

const TAG = Symbol("tag");
// TODO: alternate between high and low ids?
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
