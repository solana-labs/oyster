import React from "react";
import { useTokenName } from "./../../hooks";
import { LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber, formatPct, fromLamports } from "../../utils/utils";
import { Card, Typography } from "antd";
import { useMint } from "../../contexts/accounts";
import { PublicKey } from "@solana/web3.js";

const { Text } = Typography;

export enum SideReserveOverviewMode {
  Deposit = "deposit",
  Borrow = "borrow",
}

export const SideReserveOverview = (props: {
  className?: string;
  reserve: LendingReserve;
  address: PublicKey;
  mode: SideReserveOverviewMode;
}) => {
  const reserve = props.reserve;
  const mode = props.mode;
  const name = useTokenName(reserve?.liquidityMint);
  const liquidityMint = useMint(props.reserve.liquidityMint);

  const totalLiquidity = fromLamports(
    props.reserve.totalLiquidity.toNumber(),
    liquidityMint
  );

  // TODO: calculate
  const depositApy = 0.048;
  const borrowApy = 0.048;

  const utilizationRate = reserve.config.loanToValueRatio / 100;
  const liquidiationThreshold = reserve.config.maxUtilizationRate / 100;
  const liquidiationPenalty = reserve.config.liquidationBonus / 100;
  const maxLTV = liquidiationThreshold - liquidiationPenalty;

  let extraInfo: JSX.Element | null = null;
  if (mode === SideReserveOverviewMode.Deposit) {
    extraInfo = (
      <>
        <div className="card-row">
          <Text type="secondary" className="card-cell ">
            Deposit APY:
          </Text>
          <div className="card-cell ">{formatPct.format(depositApy)}</div>
        </div>

        <div className="card-row">
          <Text type="secondary" className="card-cell ">
            Maxiumum LTV:
          </Text>
          <div className="card-cell ">{formatPct.format(maxLTV)}</div>
        </div>

        <div className="card-row">
          <Text type="secondary" className="card-cell ">
            Liquidation threashold:
          </Text>
          <div className="card-cell ">
            {formatPct.format(liquidiationThreshold)}
          </div>
        </div>

        <div className="card-row">
          <Text type="secondary" className="card-cell ">
            Liquidation penalty:
          </Text>
          <div className="card-cell ">
            {formatPct.format(liquidiationPenalty)}
          </div>
        </div>
      </>
    );
  } else if (mode === SideReserveOverviewMode.Borrow) {
    extraInfo = (
      <>
        <div className="card-row">
          <Text type="secondary" className="card-cell ">
            Borrow APY:
          </Text>
          <div className="card-cell ">{formatPct.format(borrowApy)}</div>
        </div>
      </>
    );
  }

  return (
    <Card
      className={props.className}
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "1.2rem",
            justifyContent: "center",
          }}
        >
          <TokenIcon
            mintAddress={reserve?.liquidityMint}
            style={{ width: 30, height: 30 }}
          />{" "}
          {name} Reserve Overview
        </div>
      }
    >
      <div className="card-row">
        <Text type="secondary" className="card-cell ">
          Utilization rate:
        </Text>
        <div className="card-cell ">{formatPct.format(utilizationRate)}</div>
      </div>

      <div className="card-row">
        <Text type="secondary" className="card-cell ">
          Available liquidity:
        </Text>
        <div className="card-cell ">
          {formatNumber.format(totalLiquidity)} {name}
        </div>
      </div>

      {extraInfo}
    </Card>
  );
};
