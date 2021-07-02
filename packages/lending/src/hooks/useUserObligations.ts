import { useWallet } from '@oyster/common';
import { useMemo } from 'react';
import { useLendingObligations } from './useLendingObligations';

export function useUserObligations() {
  const { wallet } = useWallet();
  const { obligations } = useLendingObligations();

  const userObligations = useMemo(() => {
    return obligations
      .filter(
        obligation =>
          obligation.info.owner.toBase58() === wallet?.publicKey?.toBase58(),
      )
      .map(obligation => ({ obligation }))
      .sort(
        (a, b) =>
          b.obligation.info.borrowedValue.toNumber() -
          a.obligation.info.borrowedValue.toNumber(),
      );
  }, [obligations]);

  return {
    userObligations,
    totalInQuote: userObligations.reduce(
      (result, item) => result + item.obligation.info.borrowedValue.toNumber(),
      0,
    ),
  };
}

export const useUserObligation = (address: string) => {
  const userObligations = useUserObligations();
  return userObligations.userObligations.find(
    obligation => obligation.obligation.pubkey.toBase58() === address,
  );
};
