import { contexts, fromLamports, wadToLamports } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { useLendingReserve } from './useLendingReserves';
import { useUserObligationByReserve } from './useUserObligationByReserve';

const { cache, getMultipleAccounts, MintParser, useMint } = contexts.Accounts;
const { useConnection } = contexts.Connection;

export function useBorrowedAmount(address?: string | PublicKey) {
  const connection = useConnection();
  const { userObligationsByReserve } = useUserObligationByReserve(address);
  const [borrowedInfo, setBorrowedInfo] = useState({
    borrowedLamports: 0,
    borrowedInUSD: 0,
    colateralInUSD: 0,
    ltv: 0,
    health: 0,
  });
  const reserve = useLendingReserve(address);
  const liquidityMint = useMint(reserve?.info.liquidity.mint);

  useEffect(() => {
    setBorrowedInfo({
      borrowedLamports: 0,
      borrowedInUSD: 0,
      colateralInUSD: 0,
      ltv: 0,
      health: 0,
    });

    (async () => {
      // precache obligation mints
      const { keys, array } = await getMultipleAccounts(
        connection,
        // @FIXME: obligation tokens
        userObligationsByReserve.map(item =>
          item.obligation.info.tokenMint.toBase58(),
        ),
        'single',
      );

      array.forEach((item, index) => {
        const address = keys[index];
        cache.add(new PublicKey(address), item, MintParser);
      });

      const result = {
        borrowedLamports: 0,
        borrowedInUSD: 0,
        colateralInUSD: 0,
        ltv: 0,
        health: 0,
      };

      let liquidationThreshold = 0;

      userObligationsByReserve.forEach(item => {
        const borrowed = wadToLamports(
          item.obligation.info.borrows[0].borrowedAmountWads,
        ).toNumber();

        const owned = item.userAccounts.reduce(
          (amount, acc) => (amount += acc.info.amount.toNumber()),
          0,
        );

        // @FIXME: obligation tokens
        result.borrowedLamports +=
          borrowed * (owned / obligationMint?.info.supply.toNumber());
        result.borrowedInUSD += item.obligation.info.borrowedInQuote;
        result.colateralInUSD += item.obligation.info.collateralInQuote;
        // @FIXME: BigNumber
        liquidationThreshold = item.obligation.info.liquidationThreshold;
      }, 0);

      if (userObligationsByReserve.length === 1) {
        result.ltv = userObligationsByReserve[0].obligation.info.ltv;
        result.health = userObligationsByReserve[0].obligation.info.health;
      } else {
        result.ltv = (100 * result.borrowedInUSD) / result.colateralInUSD;
        result.health =
          (result.colateralInUSD * liquidationThreshold) /
          100 /
          result.borrowedInUSD;
        result.health = Number.isFinite(result.health) ? result.health : 0;
      }

      setBorrowedInfo(result);
    })();
  }, [connection, userObligationsByReserve, setBorrowedInfo]);

  return {
    borrowed: fromLamports(borrowedInfo.borrowedLamports, liquidityMint),
    ...borrowedInfo,
  };
}
