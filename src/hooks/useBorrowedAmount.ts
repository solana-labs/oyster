import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useUserObligationByReserve } from "./useUserObligationByReserve";
import { fromLamports, wadToLamports } from "../utils/utils";
import {
  cache,
  getMultipleAccounts,
  MintParser,
  ParsedAccount,
  useMint,
} from "../contexts/accounts";
import { useConnection } from "../contexts/connection";
import { MintInfo } from "@solana/spl-token";
import { useLendingReserve } from "./useLendingReserves";

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
  const liquidityMint = useMint(reserve?.info.liquidityMint);

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
        userObligationsByReserve.map((item) =>
          item.obligation.info.tokenMint.toBase58()
        ),
        "single"
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

      userObligationsByReserve.forEach((item) => {
        const borrowed = wadToLamports(
          item.obligation.info.borrowAmountWad
        ).toNumber();

        const owned = item.userAccounts.reduce(
          (amount, acc) => (amount += acc.info.amount.toNumber()),
          0
        );
        const obligationMint = cache.get(
          item.obligation.info.tokenMint
        ) as ParsedAccount<MintInfo>;

        result.borrowedLamports +=
          borrowed * (owned / obligationMint?.info.supply.toNumber());
        result.borrowedInUSD += item.obligation.info.borrowedInQuote;
        result.colateralInUSD += item.obligation.info.collateralInQuote;
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
