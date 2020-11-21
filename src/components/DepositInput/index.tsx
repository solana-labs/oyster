import React, { useCallback, useState } from "react";
import { useTokenName, useUserBalance } from '../../hooks';
import { LendingReserve } from "../../models/lending";
import { TokenIcon } from "../TokenIcon";
import { Button, Card } from "antd";
import { NumericInput } from "../Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { deposit } from '../../actions/deposit';
import { PublicKey } from "@solana/web3.js";
import './style.less';

export const DepositInput = (props: { className?: string, reserve: LendingReserve, address: PublicKey }) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [value, setValue] = useState('');

  const reserve = props.reserve;
  const address = props.address;

  const name = useTokenName(reserve?.liquidityMint);
  const { accounts: fromAccounts } = useUserBalance(reserve?.liquidityMint);
  // const collateralBalance = useUserBalance(reserve?.collateralMint);

  const onDeposit = useCallback(() => {
    deposit(
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
      <div className="deposit-input-title">
        How much would you like to deposit?
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

      <Button type="primary" onClick={onDeposit} disabled={fromAccounts.length === 0}>Deposit</Button>
    </div>
  </Card >;
}