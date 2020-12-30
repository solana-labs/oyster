import React, { useCallback, useState } from "react";
import {
  InputType,
  useUserCollateralBalance,
  useSliderInput,
  useTokenName,
  useUserBalance,
} from "../../hooks";
import { LendingReserve } from "../../models/lending";
import { TokenIcon } from "../TokenIcon";
import { Card, Slider } from "antd";
import { NumericInput } from "../Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { withdraw } from "../../actions";
import { PublicKey } from "@solana/web3.js";
import "./style.less";
import { LABELS, marks } from "../../constants";
import { ActionConfirmation } from "./../ActionConfirmation";
import { ConnectButton } from "../ConnectButton";

export const WithdrawInput = (props: {
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
  const {
    balanceLamports: collateralBalanceLamports,
    accounts: fromAccounts,
  } = useUserBalance(reserve?.collateralMint);
  const { balance: collateralBalanceInLiquidity } = useUserCollateralBalance(
    reserve
  );

  const convert = useCallback(
    (val: string | number) => {
      if (typeof val === "string") {
        return (parseFloat(val) / collateralBalanceInLiquidity) * 100;
      } else {
        return ((val * collateralBalanceInLiquidity) / 100).toFixed(2);
      }
    },
    [collateralBalanceInLiquidity]
  );

  const { value, setValue, pct, setPct, type } = useSliderInput(convert);

  const onWithdraw = useCallback(() => {
    setPendingTx(true);

    (async () => {
      try {
        await withdraw(
          fromAccounts[0],
          type === InputType.Percent
            ? (pct * collateralBalanceLamports) / 100
            : Math.ceil(
                collateralBalanceLamports *
                  (parseFloat(value) / collateralBalanceInLiquidity)
              ),
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
    address,
    collateralBalanceInLiquidity,
    collateralBalanceLamports,
    connection,
    fromAccounts,
    pct,
    reserve,
    setValue,
    type,
    value,
    wallet,
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
          <div className="withdraw-input-title">{LABELS.WITHDRAW_QUESTION}</div>
          <div className="token-input">
            <TokenIcon mintAddress={reserve?.liquidityMint} />
            <NumericInput
              value={value}
              onChange={setValue}
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

          <Slider marks={marks} value={pct} onChange={setPct} />

          <ConnectButton
            type="primary"
            onClick={onWithdraw}
            loading={pendingTx}
            disabled={fromAccounts.length === 0}
          >
            {fromAccounts.length === 0 ? LABELS.NO_DEPOSITS : LABELS.WITHDRAW_ACTION}
          </ConnectButton>
        </div>
      )}
    </Card>
  );
};
