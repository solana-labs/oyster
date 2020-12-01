import { MintInfo } from "@solana/spl-token";
import React, { useEffect, useState } from "react";
import { LABELS } from "../../constants";
import { cache, ParsedAccount } from "../../contexts/accounts";
import { useMarkets } from "../../contexts/market";
import { useLendingReserves } from "../../hooks";
import { reserveMarketCap } from "../../models";
import { formatUSD, fromLamports } from "../../utils/utils";
import { LendingReserveItem } from "./item";
import "./itemStyle.less";

export const HomeView = () => {
  const { reserveAccounts } = useLendingReserves();
  const [totalMarketSize, setTotalMarketSize] = useState(0);
  const { marketEmitter, midPriceInUSD } = useMarkets();

  useEffect(() => {
    const refreshTotalMarketSize = () => {
      const total = reserveAccounts.reduce((result, item) => {
        const marketCapLamports = reserveMarketCap(item.info);

        const localCache = cache;
        const mint = localCache.get(
          item.info.liquidityMint.toBase58()
        ) as ParsedAccount<MintInfo>;

        if (!mint) {
          return result;
        }

        const marketCap =
          fromLamports(marketCapLamports, mint?.info) *
          midPriceInUSD(mint?.pubkey.toBase58());

        return result + marketCap;
      }, 0);

      setTotalMarketSize(total);
    };

    const dispose = marketEmitter.onMarket(() => {
      refreshTotalMarketSize();
    });

    refreshTotalMarketSize();

    return () => {
      dispose();
    };
  }, [marketEmitter, midPriceInUSD, setTotalMarketSize, reserveAccounts]);

  return (
    <div className="flexColumn">
      <h2 className="home-market-size">
        Current market size: {formatUSD.format(totalMarketSize)}
      </h2>

      <div className="home-item home-header">
        <div>{LABELS.TABLE_TITLE_ASSET}</div>
        <div>{LABELS.TABLE_TITLE_MARKET_SIZE}</div>
        <div>{LABELS.TABLE_TITLE_TOTAL_BORROWED}</div>
        <div>{LABELS.TABLE_TITLE_DEPOSIT_APY}</div>
        <div>{LABELS.TABLE_TITLE_BORROW_APY}</div>
      </div>
      {reserveAccounts.map((account) => (
        <LendingReserveItem reserve={account.info} address={account.pubkey} />
      ))}
    </div>
  );
};
