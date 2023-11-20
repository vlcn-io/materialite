import { ISignal, ISource } from "@vlcn.io/materialite";
import { useEffect, useState } from "react";

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

export function useSignal<T>(signal: ISignal<T>) {
  const [value, setValue] = useState<T>(signal.value);
  useEffect(() => {
    return signal.on((value) => {
      setValue(value);
    });
  }, [signal]);

  return value;
}

// export function useSignals <-- compose signals into a new signal.
// or `useDerive`?
// or overload `useSignal` / `useNewSignal`?

export function useNewSignal<T>(fn: () => ISignal<T>, deps: any[]) {
  const [signal, setSignal] = useState<ISignal<T>>(() => {
    return fn();
  });
  const [value, setValue] = useState<T>(signal.value);
  useEffect(() => {
    const signal = fn();
    setSignal(signal);
    setValue(signal.value);
    return signal.on((value) => {
      setValue(value);
    });
  }, deps);

  return [signal, value] as const;
}
