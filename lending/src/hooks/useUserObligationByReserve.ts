import { useMemo } from "react";
import { useUserObligations } from "./useUserObligations";
import { PublicKey } from "@solana/web3.js";

export function useUserObligationByReserve(
  borrowReserve?: string | PublicKey,
  collateralReserve?: string | PublicKey
) {
  const { userObligations } = useUserObligations();

  const userObligationsByReserve = useMemo(() => {
    const borrowId =
      typeof borrowReserve === "string"
        ? borrowReserve
        : borrowReserve?.toBase58();
    const collateralId =
      typeof collateralReserve === "string"
        ? collateralReserve
        : collateralReserve?.toBase58();
    return userObligations.filter((item) =>
      borrowId && collateralId
        ? item.obligation.info.borrowReserve.toBase58() === borrowId &&
          item.obligation.info.collateralReserve.toBase58() === collateralId
        : (borrowId &&
            item.obligation.info.borrowReserve.toBase58() === borrowId) ||
          (collateralId &&
            item.obligation.info.collateralReserve.toBase58() === collateralId)
    );
  }, [borrowReserve, collateralReserve, userObligations]);

  return {
    userObligationsByReserve,
  };
}
