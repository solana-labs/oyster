import { Button } from "antd";
import Card from "antd/lib/card";
import React, { useCallback } from "react";
import { useState } from "react";
import { LABELS } from "../../constants";
import { ParsedAccount } from "../../contexts/accounts";
import { EnrichedLendingObligation, useUserBalance } from "../../hooks";
import { LendingReserve } from "../../models";
import { ActionConfirmation } from "../ActionConfirmation";
import { BackButton } from "../BackButton";
import { CollateralSelector } from "../CollateralSelector";
import { liquidate } from "../../actions";
import "./style.less";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { wadToLamports } from "../../utils/utils";

export const LiquidateInput = (props: {
  className?: string;
  repayReserve: ParsedAccount<LendingReserve>;
  withdrawReserve?: ParsedAccount<LendingReserve>;
  obligation: EnrichedLendingObligation;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const { repayReserve, withdrawReserve, obligation } = props;
  const [pendingTx, setPendingTx] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { accounts: fromAccounts } = useUserBalance(
    repayReserve?.info.liquidityMint
  );

  const onLiquidate = useCallback(() => {
    if (!withdrawReserve) {
      return;
    }

    setPendingTx(true);

    (async () => {
      try {
        await liquidate(
          connection,
          wallet,
          fromAccounts[0],
          // TODO: ensure user has available amount
          wadToLamports(obligation.info.borrowAmountWad).toNumber(),
          obligation.account,
          repayReserve,
          withdrawReserve
        );

        setShowConfirmation(true);
      } catch {
        // TODO:
      } finally {
        setPendingTx(false);
      }
    })();
  }, [
    withdrawReserve,
    fromAccounts,
    obligation,
    repayReserve,
    wallet,
    connection,
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
          <div className="liquidate-input-title">
            {LABELS.SELECT_COLLATERAL}
          </div>
          <CollateralSelector
            reserve={repayReserve.info}
            collateralReserve={withdrawReserve?.pubkey.toBase58()}
            disabled={true}
          />
          <Button
            type="primary"
            onClick={onLiquidate}
            disabled={fromAccounts.length === 0}
            loading={pendingTx}
          >
            {LABELS.LIQUIDATE_ACTION}
          </Button>
          <BackButton />
        </div>
      )}
    </Card>
  );
};
