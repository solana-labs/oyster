import { useWallet } from '@oyster/common';
import { useMemo } from 'react';
import { useObligations } from './useObligations';

export function useUserObligations() {
  const { wallet } = useWallet();
  const { obligations } = useObligations();

  const userObligations = useMemo(() => {
    return obligations
      .filter(
        obligation =>
          obligation.info.owner.toBase58() === wallet?.publicKey?.toBase58(),
      )
      .sort((a, b) =>
        b.info.borrowedValue.minus(a.info.borrowedValue).toNumber(),
      );
  }, [obligations, wallet]);

  return {
    userObligations,
    totalDepositedValue: userObligations.reduce(
      (result, item) => result + item.info.depositedValue.toNumber(),
      0,
    ),
    totalBorrowedValue: userObligations.reduce(
      (result, item) => result + item.info.borrowedValue.toNumber(),
      0,
    ),
  };
}

export const useUserObligation = (address: string) => {
  const { userObligations } = useUserObligations();
  return userObligations.find(
    obligation => obligation.pubkey.toBase58() === address,
  );
};
