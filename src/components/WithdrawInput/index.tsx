import React, { useCallback, useState } from "react";
import {
  useCollateralBalance,
  useTokenName,
  useUserBalance,
} from "../../hooks";
import { LendingReserve } from "../../models/lending";
import { TokenIcon } from "../TokenIcon";
import { Button, Card } from "antd";
import { NumericInput } from "../Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { withdraw } from "../../actions";
import { PublicKey } from "@solana/web3.js";
import "./style.less";

export const WithdrawInput = (props: {
  className?: string;
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [value, setValue] = useState("");

  const reserve = props.reserve;
  const address = props.address;

  const name = useTokenName(reserve?.liquidityMint);
  const {
    balanceLamports: collateralBalanceLamports,
    accounts: fromAccounts,
  } = useUserBalance(reserve?.collateralMint);
  const { balance: collateralBalanceInLiquidity } = useCollateralBalance(
    reserve
  );

  const onWithdraw = useCallback(() => {
    withdraw(
      fromAccounts[0],
      Math.ceil(
        collateralBalanceLamports *
          (parseFloat(value) / collateralBalanceInLiquidity)
      ),
      reserve,
      address,
      connection,
      wallet
    );
  }, [
    connection,
    wallet,
    collateralBalanceLamports,
    collateralBalanceInLiquidity,
    value,
    reserve,
    fromAccounts,
    address,
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
        <div className="withdraw-input-title">
          How much would you like to withdraw?
        </div>
        <div className="token-input">
          <TokenIcon mintAddress={reserve?.liquidityMint} />
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

        <Button
          type="primary"
          onClick={onWithdraw}
          disabled={fromAccounts.length === 0}
        >
          Withdraw
        </Button>
      </div>
    </Card>
  );
};
