/**
 * Since oyster's hooks not providing a method to detect chain operations state
 * we need a workaround to correctly trigger `loading` state in lists.
 * Hence we have three states:
 * - operation is settled and array is empty = loading
 * - array not empty = have results, !loading
 * - array empty after timeout = probably it indicates no results, !loading
 *
 * Easiest way is to watch debounced changes with trailing timeout
 **/
import { useEffect, useState } from 'react';

export const useArrayLengthWatcher = (
  target: Array<any>,
  timeout = 5000,
): boolean => {
  const [lastLength, setLastLength] = useState(target.length);
  const [isFilled, setIsFilled] = useState(false);
  const [cleanupTimer, setCleanupTimer] = useState(0);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (target.length !== lastLength) {
      setLastLength(target.length);
      if (target.length > 0) {
        // values successfully resolved
        setIsFilled(true);
      }
    } else {
      // stale value - schedule trailing cleanup
      if (!cleanupTimer) {
        setCleanupTimer(timer => {
          window.clearTimeout(timer);
          return window.setTimeout(() => {
            setIsFilled(true);
          }, timeout);
        });
      }
    }

    return () => {
      if (cleanupTimer) {
        window.clearTimeout(cleanupTimer);
      }
    };
  }, [target, timeout]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return !isFilled;
};
