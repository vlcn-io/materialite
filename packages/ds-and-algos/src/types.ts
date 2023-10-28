// Copyright (c) 2023 One Law LLC

export type Primitive = string | number | boolean | bigint;
export type Comparator<T> = (l: T, r: T) => number;
