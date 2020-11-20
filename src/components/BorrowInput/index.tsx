import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCollateralBalance, useLendingReserve, useLendingReserves, useTokenName, useUserAccounts, useUserBalance } from '../../hooks';
import { LendingReserve, LendingReserveParser } from "../../models";
import { TokenIcon } from "../TokenIcon";
import { formatNumber, getTokenName } from "../../utils/utils";
import { Button, Card, Select } from "antd";
import { useParams } from "react-router-dom";
import { cache, ParsedAccount, useAccount } from "../../contexts/accounts";
import { NumericInput } from "../Input/numeric";
import { useConnection, useConnectionConfig } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { borrow } from '../../actions';
import { PublicKey } from "@solana/web3.js";
import './style.less';
import { Token } from "@solana/spl-token";

const { Option } = Select;

const CollateralSelector = (props: {
  mint?: string,
  onMintChange: (id: string) => void;
}) => {
  const { reserveAccounts } = useLendingReserves();
  const { tokenMap } = useConnectionConfig();

  return <Select
    size="large"
    showSearch
    style={{ minWidth: 120 }}
    placeholder="Collateral"
    value={props.mint}
    onChange={(item) => {
      if (props.onMintChange) {
        props.onMintChange(item);
      }
    }}
    filterOption={(input, option) =>
      option?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0
    }
  >
    {reserveAccounts.map(reserve => {
      const mint = reserve.info.liquidityMint.toBase58();
      const address = reserve.pubkey.toBase58();
      const name = getTokenName(tokenMap, mint);
      return <Option key={address} value={address} name={name} title={address}>
      <div key={address} style={{ display: "flex", alignItems: "center" }}>
        <TokenIcon mintAddress={mint} />
        {name}
      </div>
    </Option>
    })}
  </Select>;
}

export const BorrowInput = (props: { className?: string, reserve: LendingReserve, address: PublicKey }) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const { id } = useParams<{ id: string }>();
  const [value, setValue] = useState('');

  const borrowReserve = props.reserve;
  const borrowReserveAddress = props.address;

  const [collateralReserveMint, setCollateralReserveMint] = useState<string>();
  

  const collateralReserve = useMemo(() => {
    const id: string = cache.byParser(LendingReserveParser)
      .find(acc => acc === collateralReserveMint) || '';

    return cache.get(id) as ParsedAccount<LendingReserve>;
  }, [collateralReserveMint])

  const collateral = useCollateralBalance(collateralReserve?.info);

  const name = useTokenName(borrowReserve?.liquidityMint);
  const {
    balance: tokenBalance,
    accounts: fromAccounts
  } = useUserBalance(collateralReserve?.info.collateralMint);
  // const collateralBalance = useUserBalance(reserve?.collateralMint);

  if(collateral) {
    debugger;
  }

  const onBorrow = useCallback(() => {
    if (!collateralReserve) {
      return;
    }

    debugger;

    borrow(
      fromAccounts[0],
      parseFloat(value),
      borrowReserve,
      borrowReserveAddress,
      collateralReserve.info,
      collateralReserve.pubkey,
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
      <div className="borrow-input-title">
        Select collateral account?
      </div>
      <CollateralSelector
        mint={collateralReserveMint}
        onMintChange={setCollateralReserveMint}
        />

      <Button type="primary" onClick={onBorrow} disabled={fromAccounts.length === 0}>Borrow</Button>
    </div>
  </Card >;
}