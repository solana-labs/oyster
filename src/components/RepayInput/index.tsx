import React, { useCallback, useMemo, useState } from "react";
import { useTokenName, useUserBalance } from "../../hooks";
import {
  LendingObligation,
  LendingReserve,
  LendingReserveParser,
} from "../../models";
import { TokenIcon } from "../TokenIcon";
import { Button, Card } from "antd";
import { cache, ParsedAccount } from "../../contexts/accounts";
import { NumericInput } from "../Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { repay } from "../../actions";
import { PublicKey } from "@solana/web3.js";
import { CollateralSelector } from "./../CollateralSelector";
import "./style.less";

export const RepayInput = (props: {
  className?: string;
  reserve: LendingReserve;
  obligation?: string;
  address: PublicKey;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [value, setValue] = useState("");

  const repayReserve = props.reserve;
  const repayReserveAddress = props.address;
  const obligation = props.obligation;

  const [collateralReserveMint, setCollateralReserveMint] = useState<string>();

  const collateralReserve = useMemo(() => {
    const id: string =
      cache
        .byParser(LendingReserveParser)
        .find((acc) => acc === collateralReserveMint) || "";

    return cache.get(id) as ParsedAccount<LendingReserve>;
  }, [collateralReserveMint]);

  const name = useTokenName(repayReserve?.liquidityMint);
  const { accounts: fromAccounts } = useUserBalance(
    collateralReserve?.info.collateralMint
  );
  // const collateralBalance = useUserBalance(reserve?.collateralMint);

  const { userObligations } = 

  // TODO: 
  if(!obligation) {

  }

  const onReoay = useCallback(() => {
    if (!collateralReserve) {
      return;
    }

    repay(
      fromAccounts[0],
      parseFloat(value),
      obligation as any,
      repayReserve,
      repayReserveAddress,
      collateralReserve.info,
      collateralReserve.pubkey,
      connection,
      wallet
    );
  }, [
    connection,
    wallet,
    value,
    obligation,
    collateralReserve,
    repayReserve,
    fromAccounts,
    repayReserveAddress,
  ]);

  const bodyStyle: React.CSSProperties = {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  };

  return (
    <Card className={props.className} bodyStyle={bodyStyle}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
        }}
      >
        <div className="repay-input-title">
          How much would you like to repay?
        </div>
        <div className="token-input">
          <TokenIcon mintAddress={repayReserve?.liquidityMint} />
          <NumericInput
            value={value}
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
        <div className="repay-input-title">Select collateral account?</div>
        <CollateralSelector
          reserve={repayReserve}
          mint={collateralReserveMint}
          onMintChange={setCollateralReserveMint}
        />

        <Button
          type="primary"
          onClick={onReoay}
          disabled={fromAccounts.length === 0}
        >
          Repay
        </Button>
      </div>
    </Card>
  );
};
