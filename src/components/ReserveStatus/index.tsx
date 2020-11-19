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
import { PublicKey } from "@solana/web3.js";
import './style.less';

export const ReserveStatus = (props: { className?: string, reserve: LendingReserve, address: PublicKey }) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const { id } = useParams<{ id: string }>();
  const [value, setValue] = useState('');

  const reserve = props.reserve;
  const address = props.address;

  const name = useTokenName(reserve?.liquidityMint);
  const { balance: tokenBalance, accounts: fromAccounts } = useUserBalance(reserve?.liquidityMint);


  const bodyStyle: React.CSSProperties = { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center'
  };

  return <Card className={props.className} 
    title={
      <>Reserve Status &amp; Configuration</>
    }
  bodyStyle={bodyStyle}>

    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
      TODO: Reserve Status - add chart
    </div>
  </Card >;
}