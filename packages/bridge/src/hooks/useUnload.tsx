import React from 'react'

export const useUnload = (callbackFn: (e: BeforeUnloadEvent) => void) => {
  const cb = React.useRef(callbackFn);

  React.useEffect(() => {
    const onUnload = cb.current;
    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [cb]);
};