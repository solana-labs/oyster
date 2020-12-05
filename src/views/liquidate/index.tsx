import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import React from "react";
import { LABELS, ZERO } from "../../constants";
import { LiquidateItem } from "./item";
import "./itemStyle.less";

export const LiquidateView = () => {

   // ParsedAccount<LendingObligation> 
  const obligations = [
    {
      pubkey: new PublicKey("2KfJP7pZ6QSpXa26RmsN6kKVQteDEdQmizLSvuyryeiW"),
      account: {
        executable: false,
        owner: new PublicKey("2KfJP7pZ6QSpXa26RmsN6kKVQteDEdQmizLSvuyryeiW"),
        lamports: 0,
        data: new Buffer("x"),
      },
      info: {
        lastUpdateSlot: ZERO,
        collateralAmount: ZERO,
        collateralSupply: new PublicKey("2KfJP7pZ6QSpXa26RmsN6kKVQteDEdQmizLSvuyryeiW"),
        cumulativeBorrowRateWad: ZERO,
        borrowAmountWad: new BN(0),
        borrowReserve: new PublicKey("EwhnKnkwcAeVxHDbR5wMpjwipHFuafxTUhQaaagjUxQG"),
        tokenMint: new PublicKey("2KfJP7pZ6QSpXa26RmsN6kKVQteDEdQmizLSvuyryeiW"),
      }
    }
  ];
  return (
    <div className="flexColumn">
      <div className="liquidate-item liquidate-header">
        <div>{LABELS.TABLE_TITLE_ASSET}</div>
        <div>{LABELS.TABLE_TITLE_LOAN_BALANCE}</div>
        <div>{LABELS.TABLE_TITLE_APY}</div>
        <div>{LABELS.TABLE_TITLE_ACTION}</div>
      </div>
      {obligations.map((obligation) => (
        <LiquidateItem key={obligation.pubkey.toBase58()} obligation={obligation}></LiquidateItem>
        ))}
    </div>
  );
};
