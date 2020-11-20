import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLendingReserve, useTokenName, useUserAccounts, useUserBalance } from '../../hooks';
import { LendingReserve, LendingReserveParser } from "../../models/lending";
import { TokenIcon } from "../TokenIcon";
import { formatNumber } from "../../utils/utils";
import { Button, Card } from "antd";
import { useParams } from "react-router-dom";
import { cache, useAccount } from "../../contexts/accounts";
import { NumericInput } from "../Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { borrow } from '../../actions';
import { PublicKey } from "@solana/web3.js";
import './style.less';

export const BorrowInput = (props: { className?: string, reserve: LendingReserve, address: PublicKey }) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const { id } = useParams<{ id: string }>();
  const [value, setValue] = useState('');

  const borrowReserve = props.reserve;
  const borrowReserveAddress = props.address;

  const [collateralReserve, setCollateralReserve] = useState<LendingReserve>();

  const collateralReserveAddress = useMemo(() => {
    return cache.byParser(LendingReserveParser)
      .find(acc => cache.get(acc) === collateralReserve);
  }, [collateralReserve])

  const name = useTokenName(borrowReserve?.liquidityMint);
  const { 
    balance: tokenBalance, 
    accounts: fromAccounts 
  } = useUserBalance(collateralReserve?.liquidityMint);
  // const collateralBalance = useUserBalance(reserve?.collateralMint);

  const onBorrow = useCallback(() => {
    if(!collateralReserve || !collateralReserveAddress) {
      return;
    }

    borrow(
      fromAccounts[0],
      parseFloat(value),
      borrowReserve,
      borrowReserveAddress,
      collateralReserve,
      new PublicKey(collateralReserveAddress),
      connection,
      wallet);
  }, [value, borrowReserve, fromAccounts, borrowReserveAddress]);

  const bodyStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  };

  return <Card className={props.className} bodyStyle={bodyStyle}>

    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
      <div className="borrow-input-title">
        How much would you like to borrow?
      </div>
      <div className="token-input">
        <TokenIcon mintAddress={borrowReserve?.liquidityMint} />
        <NumericInput value={value}
          onChange={(val: any) => {
            setValue(val);
          }}
          autoFocus={true}
          style={{
            fontSize: 20,
            boxShadow: "none",
            borderColor: "transparent",
            outline: "transpaernt",
          }}
          placeholder="0.00"
        />
        <div>{name}</div>
      </div>

      <Button type="primary" onClick={onBorrow} disabled={fromAccounts.length === 0}>Borrow</Button>
    </div>
  </Card >;
}