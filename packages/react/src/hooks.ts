import { ISignal, ISource } from "@vlcn.io/materialite";
import { useEffect, useRef, useState } from "react";

export function useNewSource<T>(fn: () => ISource<T>, deps: any[]) {
  const [source, setSource] = useState<ISource<T>>(() => {
    return fn();
  });
  useEffect(() => {
    const source = fn();
    setSource(source);
    return () => {
      source.detachPipelines();
    };
  }, deps);
  return source;
}

export function useView<T>(signal: ISignal<T>) {
  return useSignal(signal);
}

export function useNewView<T>(fn: () => ISignal<T>, deps: any[]) {
  return useNewSignal(fn, deps);
}

export function useQuery<T>(fn: () => ISignal<T>, deps: any[]) {
  return useNewSignal(fn, deps);
}

export function useSignal<T>(signal: ISignal<T>) {
  const [value, setValue] = useState<T>(signal.value);
  useEffect(() => {
    return signal.on((value) => {
      setValue(value);
    });
  }, [signal]);

  return value;
}

export function useNewSignal<T>(
  fn: () => ISignal<T>,
  deps: unknown[]
): [ISignal<T>, T] {
  const [signal, setSignal] = useState<ISignal<T>>();
  const [value, setValue] = useState<T>();
  const [prevDeps, setPrevDeps] = useState<unknown[] | null>(null);

  const destructor = useRef<() => void>();
  if (prevDeps === null || !shallowCompareArrays(prevDeps, deps)) {
    setPrevDeps(deps);
    const newSignal = fn();
    setSignal(newSignal);
    setValue(newSignal.value);
    if (destructor.current) {
      destructor.current();
    }
    destructor.current = newSignal.on((value) => {
      setValue(value);
    });
  }

  useEffect(() => {
    return () => {
      if (destructor.current) destructor.current();
    };
  }, []);

  // @ts-ignore
  return [signal, value] as const;
}

function shallowCompareArrays(l: unknown[], r: unknown[]) {
  if (l.length !== r.length) return false;
  for (let i = 0; i < l.length; i++) {
    if (l[i] !== r[i]) return false;
  }
  return true;
}
