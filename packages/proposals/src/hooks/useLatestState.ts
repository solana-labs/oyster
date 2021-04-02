import { useState } from 'react';

// Extends useState() hook with async getLatestState which can be used in async callbacks where state property would be stale
export function useLatestState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const getLatestState = () =>
    new Promise<T>(resolve => {
      setState(s => {
        resolve(s);
        return s;
      });
    });

  return [state, setState, getLatestState] as const;
}
