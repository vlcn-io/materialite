import { ISignal } from "@vlcn.io/materialite";
import { useEffect, useState } from "react";

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
    return signal.on((value) => {
      setValue(value);
    });
  }, deps);

  return [signal, value];
}
