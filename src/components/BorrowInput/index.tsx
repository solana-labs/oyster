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

  const reserve = props.reserve;
  const address = props.address;

  const name = useTokenName(reserve?.liquidityMint);
  const { balance: tokenBalance, accounts: fromAccounts } = useUserBalance(reserve?.liquidityMint);
  // const collateralBalance = useUserBalance(reserve?.collateralMint);

  const onBorrow = useCallback(() => {
    borrow(
      fromAccounts[0],
      parseFloat(value),
      reserve,
      address,
      connection,
      wallet);
  }, [value, reserve, fromAccounts, address]);

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
        <TokenIcon mintAddress={reserve?.liquidityMint} />
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