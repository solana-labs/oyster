import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { cache, ParsedAccount } from "./../contexts/accounts";
import { useLendingObligations } from "./useLendingObligations";
import { collateralToLiquidity, LendingObligation, LendingReserve } from "../models/lending";
import { useLendingReserves } from "./useLendingReserves";
import { fromLamports, wadToLamports } from "../utils/utils";
import { MintInfo } from "@solana/spl-token";
import { simulateMarketOrderFill } from "../contexts/market";

interface EnrichedLendingObligationInfo extends LendingObligation {
  ltv: number;
  health: number
}

export interface EnrichedLendingObligation {
  account: ParsedAccount<LendingObligation>;
  info: EnrichedLendingObligationInfo;
}

export function useEnrichedLendingObligations() {
  const { obligations } = useLendingObligations();
  const { reserveAccounts } = useLendingReserves();

  const availableReserves = useMemo(() => {
    return reserveAccounts.reduce((map, reserve) => {
        map.set(reserve.pubkey.toBase58(), reserve);
      return map;
    }, new Map<string, ParsedAccount<LendingReserve>>())
  }, [reserveAccounts]);

  // TODO: subscribe to market updates

  const enrichedObligations = useMemo(() => {
    if (availableReserves.size === 0) {
      return [];
    }

    return obligations
      .map(obligation => (
        {
          obligation,
          reserve: availableReserves.get(obligation.info.borrowReserve.toBase58()) as ParsedAccount<LendingReserve>,
          collateralReserve: availableReserves.get(obligation.info.collateralReserve.toBase58()) as ParsedAccount<LendingReserve>
        }
      ))
      // use obligations with reserves available
      .filter(item => item.reserve)
      // use reserves with borrow amount greater than zero
      .filter(item => wadToLamports(item.obligation.info.borrowAmountWad).toNumber() > 0)
      .map(item => {
        const obligation = item.obligation;
        const reserve  = item.reserve.info;
        const liquidityMint = cache.get(reserve.liquidityMint) as ParsedAccount<MintInfo>;
        let ltv = 0;

        if(liquidityMint) {
          const collateral = fromLamports(
            collateralToLiquidity(obligation.info.depositedCollateral, item.reserve.info),
            cache.get(item.collateralReserve.info.liquidityMint)?.info);

          const borrowed = wadToLamports(obligation.info.borrowAmountWad).toNumber();

          const borrowedAmount = simulateMarketOrderFill(
            borrowed,
            item.reserve.info,
            item.reserve.info.dexMarketOption ? item.reserve.info.dexMarket : item.collateralReserve.info.dexMarket
          );

          ltv = 100 * collateral / borrowedAmount;
        }

        const liquidationThreshold = item.reserve.info.config.liquidationThreshold;
        const health = ltv / liquidationThreshold
        return {
          account: obligation,
          info: {
            ...obligation.info,
            ltv,
            health,
          }
        } as EnrichedLendingObligation;
      })
      .sort((a, b) => a.info.health - b.info.health);
  }, [obligations, availableReserves]);


  return {
    obligations: enrichedObligations,
  };
}

export function useEnrichedLendingObligation(address?: string | PublicKey) {
  const id = typeof address === "string" ? address : address?.toBase58();
  const { obligations } = useEnrichedLendingObligations();

  const obligation = useMemo(() => {
    return obligations.find(ob => ob.account.pubkey.toBase58() === id);
  }, [obligations, id]);

  return obligation;
}
