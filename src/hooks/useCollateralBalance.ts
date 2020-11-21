import { useMint } from "../contexts/accounts";
import { LendingReserve } from "../models/lending";
import { fromLamports } from "../utils/utils";
import { useUserBalance } from "./useUserBalance";

export function useCollateralBalance(reserve?: LendingReserve) {
  const mint = useMint(reserve?.collateralMint);
  const { balanceLamports, accounts } = useUserBalance(reserve?.collateralMint);

  const collateralRatioLamports =
    (reserve?.totalLiquidity.toNumber() || 0) *
    (balanceLamports / (reserve?.collateralMintSupply.toNumber() || 1));

  return {
    balance: fromLamports(collateralRatioLamports, mint),
    balanceLamports: collateralRatioLamports,
    accounts,
  };
}
