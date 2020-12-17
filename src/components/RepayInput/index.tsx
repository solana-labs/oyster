import React, { useCallback, useState } from "react";
import { EnrichedLendingObligation, InputType, useAccountByMint, useSliderInput, useTokenName, useUserBalance } from "../../hooks";
import {
  LendingReserve,
} from "../../models";
import { TokenIcon } from "../TokenIcon";
import { Button, Card, Slider } from "antd";
import { ParsedAccount, useMint } from "../../contexts/accounts";
import { NumericInput } from "../Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { repay } from "../../actions";
import { CollateralSelector } from "./../CollateralSelector";
import "./style.less";
import { LABELS, marks } from "../../constants";
import { ActionConfirmation } from "./../ActionConfirmation";
import { fromLamports, wadToLamports } from "../../utils/utils";
import { notify } from "../../utils/notifications";

export const RepayInput = (props: {
  className?: string;
  borrowReserve: ParsedAccount<LendingReserve>;
  collateralReserve?: ParsedAccount<LendingReserve>;
  obligation: EnrichedLendingObligation;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [pendingTx, setPendingTx] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const repayReserve = props.borrowReserve;
  const obligation = props.obligation;

  const liquidityMint = useMint(repayReserve.info.liquidityMint);

  const borrowAmountLamports = wadToLamports(obligation.info.borrowAmountWad).toNumber();
  const borrowAmount = fromLamports(
    borrowAmountLamports,
    liquidityMint
  );
  const collateralReserve = props.collateralReserve;

  const name = useTokenName(repayReserve?.info.liquidityMint);
  const { accounts: fromAccounts } = useUserBalance(
    repayReserve.info.liquidityMint
  );

  const obligationAccount = useAccountByMint(obligation?.info.tokenMint);

  const convert = useCallback(
    (val: string | number) => {
      if (typeof val === "string") {
        return (parseFloat(val) / borrowAmount) * 100;
      } else {
        return ((val * borrowAmount) / 100).toFixed(2);
      }
    },
    [borrowAmount]
  );

  const { value, setValue, pct, setPct, type } = useSliderInput(convert);

  const onRepay = useCallback(() => {
    if (
      !collateralReserve ||
      !obligation ||
      !repayReserve ||
      !obligationAccount
    ) {
      return;
    }

    setPendingTx(true);

    (async () => {
      try {
        const toRepayLamports = type === InputType.Percent
          ? (pct * borrowAmountLamports) / 100
          : Math.ceil(borrowAmountLamports * (parseFloat(value) / borrowAmount));

        await repay(
          fromAccounts[0],
          toRepayLamports,
          obligation.account,
          obligationAccount,
          repayReserve,
          collateralReserve,
          connection,
          wallet
        );

        setValue("");
        setShowConfirmation(true);
      } catch (error) {
        notify({
          message: "Unable to repay loan.",
          type: "error",
          description: error.message,
        });
        
      } finally {
        setPendingTx(false);
      }
    })();
  }, [
    pct,
    value,
    borrowAmount,
    borrowAmountLamports,
    type,
    connection,
    wallet,
    obligation,
    collateralReserve,
    repayReserve,
    fromAccounts,
    obligationAccount,
    setValue,
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
          <div className="repay-input-title">
            {LABELS.REPAY_QUESTION}
          </div>
          <div className="token-input">
            <TokenIcon mintAddress={repayReserve?.info.liquidityMint} />
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
          <Slider
              marks={marks}
              value={pct}
              onChange={setPct}
            />
          <div className="repay-input-title">{LABELS.COLLATERAL}</div>
          <CollateralSelector
            reserve={repayReserve.info}
            collateralReserve={collateralReserve?.pubkey.toBase58()}
            disabled={true}
          />

          <Button
            type="primary"
            onClick={onRepay}
            loading={pendingTx}
            disabled={fromAccounts.length === 0}
          >
            {LABELS.REPAY_ACTION}
          </Button>
        </div>
      )}
    </Card>
  );
};
