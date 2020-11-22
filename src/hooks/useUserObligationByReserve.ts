import { useMemo } from "react";
import { useUserObligations } from "./useUserObligations";
import { PublicKey } from "@solana/web3.js";

export function useUserObligationByReserve(reserve: PublicKey) {
  const { userObligations } = useUserObligations();

  const userObligationsByReserve = useMemo(
    () =>
      userObligations.filter((item) =>
        item.oblication.info.borrowReserve.equals(reserve)
      ),
    [reserve, userObligations]
  );

  return {
    userObligationsByReserve,
  };
}
