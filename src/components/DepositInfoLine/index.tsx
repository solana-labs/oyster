import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLendingReserve, useTokenName, useUserAccounts, useUserBalance } from './../../hooks';
import { LendingReserve, LendingReserveParser } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber } from "../../utils/utils";
import { Button, Card } from "antd";
import { useParams } from "react-router-dom";
import { cache, useAccount } from "../../contexts/accounts";
import { NumericInput } from "../../components/Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { deposit } from './../../actions/deposit';
import './style.less';
import { PublicKey } from "@solana/web3.js";

export const DepositInfoLine = (props: { 
  className?: string,
  reserve: LendingReserve, 
  address: PublicKey }) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const { balance: tokenBalance } = useUserBalance(props.reserve.liquidityMint);
  const { balance: collateralBalance } = useUserBalance(props.reserve.collateralMint);

  return <Card className={props.className} bodyStyle={{ display: 'flex', justifyContent: 'space-around',  }} >
    <div className="deposit-info-line-item ">
      <div>Your balance in Oyster</div>
      <div>{formatNumber.format(collateralBalance)} {name}</div>
    </div>
    <div className="deposit-info-line-item ">
      <div>Your wallet balance</div>
      <div>{formatNumber.format(tokenBalance)} {name}</div>
    </div>
    <div className="deposit-info-line-item ">
      <div>Health factor</div>
      <div>--</div>
    </div>
  </Card>
}