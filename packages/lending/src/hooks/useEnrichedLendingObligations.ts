import {
  contexts,
  fromLamports,
  getTokenName,
  ParsedAccount,
  wadToLamports,
} from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { simulateMarketOrderFill, useMarkets } from '../contexts/market';
import { collateralToLiquidity, Obligation, Reserve } from '../models';
import { useLendingObligations } from './useLendingObligations';
import { useLendingReserves } from './useLendingReserves';

const { cache } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;

// @FIXME: BigNumber
interface EnrichedLendingObligationInfo extends Obligation {
  ltv: number;
  health: number;
  borrowedInQuote: number;
  collateralInQuote: number;
  liquidationThreshold: BN;
  repayName: string;
  collateralName: string;
}

// @TODO: rework
export interface EnrichedLendingObligation {
  account: ParsedAccount<Obligation>;
  info: EnrichedLendingObligationInfo;
}

export function useEnrichedLendingObligations() {
  const { obligations } = useLendingObligations();
  const { reserveAccounts } = useLendingReserves();
  const { tokenMap } = useConnectionConfig();
  const { marketEmitter, midPriceInUSD } = useMarkets();

  const availableReserves = useMemo(() => {
    return reserveAccounts.reduce((map, reserve) => {
      map.set(reserve.pubkey.toBase58(), reserve);
      return map;
    }, new Map<string, ParsedAccount<Reserve>>());
  }, [reserveAccounts]);

  const enrichedFactory = useCallback(() => {
    if (availableReserves.size === 0) {
      return [];
    }

    return (
      obligations
        .map(obligation => ({
          obligation,
          reserve: availableReserves.get(
            obligation.info.borrows[0].borrowReserve.toBase58(),
          ) as ParsedAccount<Reserve>,
          depositReserve: availableReserves.get(
            obligation.info.deposits[0].depositReserve.toBase58(),
          ) as ParsedAccount<Reserve>,
        }))
        // use obligations with reserves available
        .filter(item => item.reserve)
        // use reserves with borrow amount greater than zero
        .filter(
          item =>
            wadToLamports(
              item.obligation.info.borrows[0].borrowedAmountWads,
            ).toNumber() > 0,
        )
        .map(item => {
          const obligation = item.obligation;
          const reserve = item.reserve.info;
          const depositReserve = item.reserve.info;
          const liquidityMint = cache.get(
            reserve.liquidity.mint,
          ) as ParsedAccount<MintInfo>;
          let ltv = 0;
          let health = 0;
          let borrowedInQuote = 0;
          let collateralInQuote = 0;

          if (liquidityMint) {
            const collateralMint = cache.get(
              item.depositReserve.info.liquidity.mint,
            );

            const collateral = fromLamports(
              collateralToLiquidity(
                obligation.info.deposits[0].depositedAmount,
                item.reserve.info,
              ),
              collateralMint?.info,
            );

            const borrowed = wadToLamports(
              obligation.info.borrows[0].borrowedAmountWads,
            ).toNumber();

            const borrowedAmount = simulateMarketOrderFill(
              borrowed,
              item.reserve.info,
              // @FIXME: aggregator
              item.reserve.info.liquidity.aggregatorOption
                ? item.reserve.info.liquidity.aggregator
                : item.depositReserve.info.liquidity.aggregator,
              true,
            );

            const liquidityMintAddress = item.reserve.info.liquidity.mint.toBase58();
            const liquidityMint = cache.get(
              liquidityMintAddress,
            ) as ParsedAccount<MintInfo>;
            borrowedInQuote =
              fromLamports(borrowed, liquidityMint.info) *
              midPriceInUSD(liquidityMintAddress);
            collateralInQuote =
              collateral *
              midPriceInUSD(collateralMint?.pubkey.toBase58() || '');

            ltv = (100 * borrowedAmount) / collateral;

            const liquidationThreshold =
              item.reserve.info.config.liquidationThreshold;
            health = (collateral * liquidationThreshold) / 100 / borrowedAmount;
          }

          return {
            account: obligation,
            info: {
              ...obligation.info,
              ltv,
              health,
              borrowedInQuote,
              collateralInQuote,
              // @FIXME: BigNumber
              liquidationThreshold:
                item.reserve.info.config.liquidationThreshold,
              repayName: getTokenName(tokenMap, reserve.liquidity.mint),
              collateralName: getTokenName(
                tokenMap,
                depositReserve.liquidity.mint,
              ),
            },
          } as EnrichedLendingObligation;
        })
        .sort((a, b) => a.info.health - b.info.health)
    );
  }, [obligations, availableReserves, midPriceInUSD, tokenMap]);

  const [enriched, setEnriched] = useState<EnrichedLendingObligation[]>(
    enrichedFactory(),
  );

  useEffect(() => {
    const dispose = marketEmitter.onMarket(() => {
      setEnriched(enrichedFactory());
    });

    return () => {
      dispose();
    };
  }, [enrichedFactory, setEnriched, marketEmitter, midPriceInUSD]);

  return {
    obligations: enriched,
  };
}

export function useEnrichedLendingObligation(address?: string | PublicKey) {
  const id = typeof address === 'string' ? address : address?.toBase58();
  const { obligations } = useEnrichedLendingObligations();

  const obligation = useMemo(() => {
    return obligations.find(ob => ob.account.pubkey.toBase58() === id);
  }, [obligations, id]);

  return obligation;
}
