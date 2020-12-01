import React, { useCallback, useState } from "react";
import {
  InputType,
  useSliderInput,
  useTokenName,
  useUserBalance,
} from "../../hooks";
import { LendingReserve } from "../../models/lending";
import { TokenIcon } from "../TokenIcon";
import { Button, Card, Slider, Spin } from "antd";
import { NumericInput } from "../Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { deposit } from "../../actions/deposit";
import { PublicKey } from "@solana/web3.js";
import "./style.less";
import { LoadingOutlined } from "@ant-design/icons";
import { ActionConfirmation } from "./../ActionConfirmation";
import { marks } from "../../constants";

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

export const DepositInput = (props: {
  className?: string;
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [pendingTx, setPendingTx] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const reserve = props.reserve;
  const address = props.address;

  const name = useTokenName(reserve?.liquidityMint);
  const { accounts: fromAccounts, balance, balanceLamports } = useUserBalance(
    reserve?.liquidityMint
  );
  // const collateralBalance = useUserBalance(reserve?.collateralMint);

  const convert = useCallback(
    (val: string | number) => {
      if (typeof val === "string") {
        return (parseFloat(val) / balance) * 100;
      } else {
        return ((val * balance) / 100).toFixed(2);
      }
    },
    [balance]
  );

  const { value, setValue, mark, setMark, type } = useSliderInput(convert);

  const onDeposit = useCallback(() => {
    setPendingTx(true);

    (async () => {
      try {
        await deposit(
          fromAccounts[0],
          type === InputType.Slider
            ? (mark * balanceLamports) / 100
            : Math.ceil(balanceLamports * (parseFloat(value) / balance)),
          reserve,
          address,
          connection,
          wallet
        );

        setValue("");
        setShowConfirmation(true);
      } catch {
        // TODO:
      } finally {
        setPendingTx(false);
      }
    })();
  }, [
    connection,
    setValue,
    balanceLamports,
    balance,
    wallet,
    value,
    mark,
    type,
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
      {showConfirmation ? (
        <ActionConfirmation onClose={() => setShowConfirmation(false)} />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
          }}
        >
          <div className="deposit-input-title">
            How much would you like to deposit?
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
                outline: "transparent",
              }}
              placeholder="0.00"
            />
            <div>{name}</div>
          </div>

          <Slider marks={marks} value={mark} onChange={setMark} />

          <Button
            type="primary"
            onClick={onDeposit}
            disabled={fromAccounts.length === 0 || pendingTx}
          >
            Deposit
            {pendingTx && (
              <Spin indicator={antIcon} className="action-spinner" />
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};
