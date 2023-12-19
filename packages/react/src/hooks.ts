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

export function useQuery<T>(
  fn: () => ISignal<T>,
  deps: any[],
  name: string = ""
) {
  return useNewSignal(fn, deps, name);
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
  deps: unknown[],
  name: string = ""
): readonly [ISignal<T>, T] {
  const signalRef = useRef<ISignal<T>>();
  const subscriber = useRef<Subscriber<T>>();
  const prevDeps = useRef<unknown[] | null>(null);

  useEffect(() => {
    return () => {
      if (subscriber.current) {
        subscriber.current.destroy();
      }
    };
  }, []);

  let newSignal: ISignal<T> | null = null;
  if (
    prevDeps.current == null ||
    !shallowCompareArrays(prevDeps.current, deps)
  ) {
    prevDeps.current = deps;

    // TODO: computing the new signal is for some reason notifying
    // paths that shouldn't get the information. This is a bug.
    // Workaround at the moment is to destroy the previous subscriber first.
    const lastSubscriber = subscriber.current;
    if (lastSubscriber) {
      lastSubscriber.destroy();
    }

    newSignal = fn();
    signalRef.current = newSignal;
  }

  const [value, setValue] = useState<T | null>(
    newSignal ? newSignal.value : null
  );
  if (newSignal) {
    subscriber.current = new Subscriber(newSignal, setValue, name);
    setValue(newSignal.value);
  }

  return [signalRef.current!, value!] as const;
}

function shallowCompareArrays(l: unknown[], r: unknown[]) {
  if (l.length !== r.length) return false;
  for (let i = 0; i < l.length; i++) {
    if (l[i] !== r[i]) return false;
  }
  return true;
}

let id = 0;
class Subscriber<T> {
  readonly #unsub: () => void;
  private destroyed = false;
  public readonly id = id++;

  constructor(
    signal: ISignal<T>,
    public readonly setValue: (value: T) => void,
    public readonly name: string
  ) {
    this.#unsub = signal.on(this.#signalChanged);
  }

  destroy() {
    this.destroyed = true;
    this.#unsub();
  }

  #signalChanged = (value: T) => {
    if (this.destroyed) {
      return;
    }
    this.setValue(value);
  };
}
