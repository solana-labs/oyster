import { contexts, fromLamports, wadToLamports } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { useLendingReserve } from './useLendingReserves';
import { useUserObligationByReserve } from './useUserObligationByReserve';

const { useMint } = contexts.Accounts;
const { useConnection } = contexts.Connection;

export function useBorrowedAmount(address?: string | PublicKey) {
  const connection = useConnection();
  const { userObligationsByReserve } = useUserObligationByReserve(address);
  const [borrowedInfo, setBorrowedInfo] = useState({
    borrowedLamports: 0,
    borrowedInUSD: 0,
    collateralInUSD: 0,
    ltv: 0,
    health: 0,
  });
  const reserve = useLendingReserve(address);
  const liquidityMint = useMint(reserve?.info.liquidity.mintPubkey);

  useEffect(() => {
    setBorrowedInfo({
      borrowedLamports: 0,
      borrowedInUSD: 0,
      collateralInUSD: 0,
      ltv: 0,
      health: 0,
    });

    (async () => {
      const result = {
        borrowedLamports: wadToLamports(reserve.info.liquidity.borrowedAmountWads).toNumber(),
        borrowedInUSD: 0,
        collateralInUSD: 0,
        ltv: 0,
        health: 0,
      };

      let liquidationThreshold = reserve.info.config.liquidationThreshold;

      // @FIXME: see if this requires obligations
      userObligationsByReserve.forEach(item => {
        result.borrowedInUSD += item.obligation.info.borrowedValue;
        result.collateralInUSD += item.obligation.info.depositedValue;
      }, 0);

      if (userObligationsByReserve.length === 1) {
        result.ltv = userObligationsByReserve[0].obligation.info.ltv;
        result.health = userObligationsByReserve[0].obligation.info.health;
      } else {
        result.ltv = (100 * result.borrowedInUSD) / result.collateralInUSD;
        result.health =
          (result.collateralInUSD * liquidationThreshold) /
          100 /
          result.borrowedInUSD;
        result.health = Number.isFinite(result.health) ? result.health : 0;
      }

      setBorrowedInfo(result);
    })();
  }, [connection, reserve, userObligationsByReserve, setBorrowedInfo]);

  return {
    borrowed: fromLamports(borrowedInfo.borrowedLamports, liquidityMint),
    ...borrowedInfo,
  };
}
