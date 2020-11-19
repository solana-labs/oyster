import React, { useMemo } from "react";
import { useLendingReserve, useTokenName, useUserAccounts, useUserBalance } from './../../hooks';
import { LendingReserve, LendingReserveParser } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber, formatPct, fromLamports } from "../../utils/utils";
import { Button, Card, Typography } from "antd";
import { useParams } from "react-router-dom";
import { useAccount, useMint } from "../../contexts/accounts";
import { PublicKey } from "@solana/web3.js";

const { Text } = Typography;

export const UserLendingCard = (props: {
  className?: string;
  reserve: LendingReserve,
  address: PublicKey,
}) => {
  const reserve = props.reserve;
  const name = useTokenName(reserve?.liquidityMint);
  const liquidityMint = useMint(props.reserve.liquidityMint);

  const totalLiquidity = fromLamports(props.reserve.totalLiquidity.toNumber(), liquidityMint);

  // TODO: calculate
  const borrowed = 0;
  const healthFactor = '--';
  const ltv = 0.75;
  const available = 0;


  return <Card className={props.className} title={
    <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.2rem', justifyContent: 'center' }}>
      Your Information
    </div>
  }>
    <h3>Borrows</h3>

    <div className="card-row">
      <Text type="secondary" className="card-cell ">
        Borrowed
        </Text>
      <div className="card-cell ">
        {formatNumber.format(borrowed)} {name}
      </div>
    </div>

    <div className="card-row">
      <Text type="secondary" className="card-cell ">
        Health factor:
        </Text>
      <div className="card-cell ">
        {healthFactor}
      </div>
    </div>

    <div className="card-row">
      <Text type="secondary" className="card-cell ">
        Loan to value:
        </Text>
      <div className="card-cell ">
        {formatNumber.format(ltv)}
      </div>
    </div>

    <div className="card-row">
      <Text type="secondary" className="card-cell ">
        Available to you:
        </Text>
      <div className="card-cell ">
        {formatNumber.format(available)} {name}
      </div>
    </div>

    <h3>Deposits</h3>

    <div className="card-row">
      <Text type="secondary" className="card-cell ">
        Wallet balance:
        </Text>
      <div className="card-cell ">
        {formatNumber.format(totalLiquidity)} {name}
      </div>
    </div>

    <div className="card-row">
      <Text type="secondary" className="card-cell ">
        You already deposited:
        </Text>
      <div className="card-cell ">
        {formatNumber.format(totalLiquidity)} {name}
      </div>
    </div>

 
  </Card>;
}