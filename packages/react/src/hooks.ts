export function useSignal(signal: ISignal) {}

// Materializes a stream, binds to it, returns it
export function useMaterialize(stream: Stream) {}

export function useCreateSignal(fn: () => ISignal) {}
