import React, { useCallback, useState } from "react";
import {
  InputType,
  useCollateralBalance,
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
import { withdraw } from "../../actions";
import { PublicKey } from "@solana/web3.js";
import "./style.less";
import { LABELS, marks } from "../../constants";
import { LoadingOutlined } from "@ant-design/icons";
import { ActionConfirmation } from "./../ActionConfirmation";

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

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
  const { balance: collateralBalanceInLiquidity } = useCollateralBalance(
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

  const { value, setValue, mark, setMark, type } = useSliderInput(convert);

  const onWithdraw = useCallback(() => {
    setPendingTx(true);

    (async () => {
      try {
        await withdraw(
          fromAccounts[0],
          type === InputType.Slider
            ? (mark * collateralBalanceLamports) / 100
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
    mark,
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

          <Slider marks={marks} value={mark} onChange={setMark} />

          <Button
            type="primary"
            onClick={onWithdraw}
            disabled={fromAccounts.length === 0 || pendingTx}
          >
            {LABELS.WITHDRAW_ACTION}
            {pendingTx && (
              <Spin indicator={antIcon} className="action-spinner" />
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};
