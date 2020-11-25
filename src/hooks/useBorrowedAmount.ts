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
  const [borrowedLamports, setBorrowedLamports] = useState(0);
  const reserve = useLendingReserve(address);
  const liquidityMint = useMint(reserve?.info.liquidityMint);

  useEffect(() => {
    setBorrowedLamports(0);

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

      setBorrowedLamports(
        userObligationsByReserve.reduce((result, item) => {
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

          result += (borrowed * owned) / obligationMint?.info.supply.toNumber();
          return result;
        }, 0)
      );
    })();
  }, [connection, userObligationsByReserve]);

  return {
    borrowed: fromLamports(borrowedLamports, liquidityMint),
    borrowedLamports,
  };
}
