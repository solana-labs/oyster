import { useMemo } from "react";
import { useUserObligations } from "./useUserObligations";
import { PublicKey } from "@solana/web3.js";

export function useUserObligationByReserve(reserve?: string | PublicKey) {
  const { userObligations } = useUserObligations();

  const userObligationsByReserve = useMemo(
    () => {
      const id = typeof reserve === 'string' ? reserve : reserve?.toBase58();
      return userObligations.filter((item) =>
        item.obligation.info.borrowReserve.toBase58() === id
      )
    }, [reserve, userObligations]
  );

  return {
    userObligationsByReserve,
  };
}
