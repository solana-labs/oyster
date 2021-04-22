import {
  contexts,
  fromLamports,
  getTokenName,
  ParsedAccount,
  TokenAccount,
  useUserAccounts,
} from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import { useEffect, useMemo, useState } from 'react';
import { useMarkets } from '../contexts/market';
import { calculateDepositAPY, Reserve } from '../models';
import { calculateCollateralBalance } from './useCollateralBalance';
import { useLendingReserves } from './useLendingReserves';

const { cache } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;

export interface UserDeposit {
  account: TokenAccount;
  info: {
    amount: number;
    amountInQuote: number;
    apy: number;
    name: string;
    precision: number;
  };
  reserve: ParsedAccount<Reserve>;
}

export function useUserDeposits(exclude?: Set<string>, include?: Set<string>) {
  const { userAccounts } = useUserAccounts();
  const { reserveAccounts } = useLendingReserves();
  const [userDeposits, setUserDeposits] = useState<UserDeposit[]>([]);
  const { marketEmitter, midPriceInUSD } = useMarkets();
  const { tokenMap } = useConnectionConfig();

  const reservesByCollateralMint = useMemo(() => {
    return reserveAccounts.reduce((result, item) => {
      const id = item.pubkey.toBase58();
      if (exclude && exclude.has(id)) {
        return result;
      }

      if (!include || include.has(id)) {
        result.set(item.info.collateral.mint.toBase58(), item);
      }

      return result;
    }, new Map<string, ParsedAccount<Reserve>>());
  }, [reserveAccounts, exclude, include]);

  useEffect(() => {
    const activeMarkets = new Set(
      reserveAccounts.map(r => r.info.liquidity.aggregator.toBase58()),
    );

    const userDepositsFactory = () => {
      return userAccounts
        .filter(acc => reservesByCollateralMint.has(acc?.info.mint.toBase58()))
        .map(item => {
          const reserve = reservesByCollateralMint.get(
            item?.info.mint.toBase58(),
          ) as ParsedAccount<Reserve>;

          let collateralMint = cache.get(
            reserve.info.collateral.mint,
          ) as ParsedAccount<MintInfo>;

          const amountLamports = calculateCollateralBalance(
            reserve.info,
            item?.info.amount.toNumber(),
          );
          const amount = fromLamports(amountLamports, collateralMint?.info);
          const price = midPriceInUSD(reserve.info.liquidity.mint.toBase58());
          const amountInQuote = price * amount;

          return {
            account: item,
            info: {
              amount,
              amountInQuote: amountInQuote,
              apy: calculateDepositAPY(reserve.info),
              name: getTokenName(tokenMap, reserve.info.liquidity.mint),
            },
            reserve,
          } as UserDeposit;
        })
        .sort((a, b) => b.info.amountInQuote - a.info.amountInQuote);
    };

    const dispose = marketEmitter.onMarket(args => {
      // ignore if none of the markets is used by the reserve
      if ([...args.ids.values()].every(id => !activeMarkets.has(id))) {
        return;
      }

      setUserDeposits(userDepositsFactory());
    });

    setUserDeposits(userDepositsFactory());

    return () => {
      dispose();
    };
  }, [
    userAccounts,
    reserveAccounts,
    reservesByCollateralMint,
    tokenMap,
    midPriceInUSD,
    marketEmitter,
  ]);

  return {
    userDeposits,
    totalInQuote: userDeposits.reduce(
      (res, item) => res + item.info.amountInQuote,
      0,
    ),
  };
}
