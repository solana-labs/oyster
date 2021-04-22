import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { useUserObligations } from './useUserObligations';

export function useUserObligationByReserve(
  borrowReserve?: string | PublicKey,
  depositReserve?: string | PublicKey,
) {
  const { userObligations } = useUserObligations();

  const userObligationsByReserve = useMemo(() => {
    const borrowReservePubkey =
      typeof borrowReserve === 'string'
        ? borrowReserve
        : borrowReserve?.toBase58();
    const depositReservePubkey =
      typeof depositReserve === 'string'
        ? depositReserve
        : depositReserve?.toBase58();
    return userObligations.filter(item => {
      // @FIXME: borrows and deposits may be empty
      if (borrowReservePubkey && depositReservePubkey) {
        return (
          item.obligation.info.borrows[0].borrowReserve.toBase58() ===
            borrowReservePubkey &&
          item.obligation.info.deposits[0].depositReserve.toBase58() ===
            depositReservePubkey
        );
      } else {
        return (
          (borrowReservePubkey &&
            item.obligation.info.borrows[0].borrowReserve.toBase58() ===
              borrowReservePubkey) ||
          (depositReservePubkey &&
            item.obligation.info.deposits[0].depositReserve.toBase58() ===
              depositReservePubkey)
        );
      }
    });
  }, [borrowReserve, depositReserve, userObligations]);

  return {
    userObligationsByReserve,
  };
}
