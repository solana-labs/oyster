import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLendingReserve, useTokenName, useUserAccounts, useUserBalance } from './../../../hooks';
import { LendingReserve, LendingReserveParser } from "../../../models/lending";
import { TokenIcon } from "../../../components/TokenIcon";
import { formatNumber } from "../../../utils/utils";
import { Button, Card } from "antd";
import { useParams } from "react-router-dom";
import { cache, useAccount } from "../../../contexts/accounts";
import { NumericInput } from "../../../components/Input/numeric";
import { useConnection } from "../../../contexts/connection";
import { useWallet } from "../../../contexts/wallet";
import { deposit } from './../../../actions/deposit';

export const DepositAddView = () => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const { id } = useParams<{ id: string }>();
  const [value, setValue] = useState('');
  const lendingReserve = useLendingReserve(id);
  const reserve = lendingReserve?.info;

  const name = useTokenName(reserve?.liquidityMint);
  const { balance: tokenBalance, accounts: fromAccounts } = useUserBalance(reserve?.liquidityMint);
  // const collateralBalance = useUserBalance(reserve?.collateralMint);

  useEffect(() => {
    (async () => {
      const reserve = lendingReserve?.info;
      if (!reserve) {
        return;
      }

      console.log(`utlization: ${reserve.maxUtilizationRate}`)
      console.log(`cumulativeBorrowRate: ${reserve.cumulativeBorrowRate.toString()}`)
      console.log(`lendingMarket: ${reserve.lendingMarket.toBase58()}`);

      const lendingMarket = await cache.get(reserve.lendingMarket);
      console.log(`lendingMarket quote: ${lendingMarket?.info.quoteMint.toBase58()}`);

      console.log(`liquiditySupply: ${reserve.liquiditySupply.toBase58()}`);
      console.log(`liquidityMint: ${reserve.liquidityMint.toBase58()}`);
      console.log(`collateralSupply: ${reserve.collateralSupply.toBase58()}`);
      console.log(`collateralMint: ${reserve.collateralMint.toBase58()}`);
    })();
  }, [lendingReserve])

  console.log(fromAccounts);

  const onDeposit = useCallback(() => {
    if (!lendingReserve || !reserve) {
      return;
    }

    deposit(
      fromAccounts[0],
      parseFloat(value),
      reserve,
      lendingReserve.pubkey,
      connection,
      wallet);
  }, [value, reserve, fromAccounts]);

  return <Card title={(
    <h2 style={{ display: 'flex', alignItems: 'center', width: 400 }}>
      <TokenIcon mintAddress={reserve?.liquidityMint} style={{ width: 40, height: 40 }} /> Deposit {name}
    </h2>
  )}>
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>

      <NumericInput value={value}
        onChange={(val: any) => {
          setValue(val);
        }}
        style={{
          fontSize: 20,
          boxShadow: "none",
          borderColor: "transparent",
          outline: "transpaernt",
        }}
        placeholder="0.00"
      />

      <Button type="primary" onClick={onDeposit} disabled={fromAccounts.length === 0}>Deposit</Button>
    </div>
  </Card >;
}