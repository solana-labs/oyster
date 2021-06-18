import { useConnection } from '@oyster/common';

import { useEffect, useState } from 'react';

export const useIsBeyondSlot = (slot: number | undefined) => {
  const connection = useConnection();
  const [isBeyondSlot, setIsBeyondSlot] = useState<boolean | undefined>();

  useEffect(() => {
    if (!slot) {
      return;
    }

    const sub = (async () => {
      const currentSlot = await connection.getSlot();
      if (currentSlot > slot) {
        setIsBeyondSlot(true);
        return;
      }

      setIsBeyondSlot(false);

      const id = setInterval(() => {
        connection.getSlot().then(currentSlot => {
          if (currentSlot > slot) {
            setIsBeyondSlot(true);
            clearInterval(id!);
          }
        });
      }, 5000); // TODO: How to estimate the slot distance to avoid uneccesery checks?

      return id;
    })();

    return () => {
      sub.then(id => id && clearInterval(id));
    };
  }, [connection, slot]);

  return isBeyondSlot;
};
