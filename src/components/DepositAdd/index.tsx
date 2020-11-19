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

export const DepositAdd = (props: { className?: string, reserve: LendingReserve, address: PublicKey }) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const { id } = useParams<{ id: string }>();
  const [value, setValue] = useState('');

  const reserve = props.reserve;
  const address = props.address;

  const name = useTokenName(reserve?.liquidityMint);
  const { balance: tokenBalance, accounts: fromAccounts } = useUserBalance(reserve?.liquidityMint);
  // const collateralBalance = useUserBalance(reserve?.collateralMint);

  useEffect(() => {
    (async () => {
      console.log(`utlization: ${reserve.maxUtilizationRate}`)
      console.log(`cumulativeBorrowRate: ${reserve.cumulativeBorrowRate.toString()}`)
      console.log(`cumulativeBorrowRate: ${reserve.cumulativeBorrowRate.toString()}`)
      console.log(`totalBorrows: ${reserve.totalBorrows.toString()}`)
      console.log(`totalLiquidity: ${reserve.totalLiquidity.toString()}`)
      console.log(`lendingMarket: ${reserve.lendingMarket.toBase58()}`);

      const lendingMarket = await cache.get(reserve.lendingMarket);
      console.log(`lendingMarket quote: ${lendingMarket?.info.quoteMint.toBase58()}`);

      console.log(`liquiditySupply: ${reserve.liquiditySupply.toBase58()}`);
      console.log(`liquidityMint: ${reserve.liquidityMint.toBase58()}`);
      console.log(`collateralSupply: ${reserve.collateralSupply.toBase58()}`);
      console.log(`collateralMint: ${reserve.collateralMint.toBase58()}`);
    })();
  }, [reserve])

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
    justifyContent: 'center', 
    width: '100%', 
    height: '100%',
    alignItems: 'center'
  };

  return <Card className={props.className} bodyStyle={bodyStyle}>

    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
      <div className="deposit-add-title">
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