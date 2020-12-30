import React, { useCallback, useMemo, useState } from "react";
import {
  useTokenName,
  useUserBalance,
  useUserObligationByReserve,
} from "../../hooks";
import {
  BorrowAmountType,
  LendingReserve,
  LendingReserveParser,
} from "../../models";
import { TokenIcon } from "../TokenIcon";
import { Card } from "antd";
import { cache, ParsedAccount } from "../../contexts/accounts";
import { NumericInput } from "../Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { borrow } from "../../actions";
import { CollateralSelector } from "./../CollateralSelector";
import "./style.less";
import { LABELS } from "../../constants";
import { ActionConfirmation } from "./../ActionConfirmation";
import { BackButton } from "./../BackButton";
import { ConnectButton } from "../ConnectButton";

export const BorrowInput = (props: {
  className?: string;
  reserve: ParsedAccount<LendingReserve>;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [value, setValue] = useState("");
  const [pendingTx, setPendingTx] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const borrowReserve = props.reserve;

  const [collateralReserveKey, setCollateralReserveKey] = useState<string>();

  const collateralReserve = useMemo(() => {
    const id: string =
      cache
        .byParser(LendingReserveParser)
        .find((acc) => acc === collateralReserveKey) || "";

    return cache.get(id) as ParsedAccount<LendingReserve>;
  }, [collateralReserveKey]);

  const name = useTokenName(borrowReserve?.info.liquidityMint);
  const { accounts: fromAccounts } = useUserBalance(
    collateralReserve?.info.collateralMint
  );

  const { userObligationsByReserve } = useUserObligationByReserve(
    borrowReserve?.pubkey,
    collateralReserve?.pubkey
  );

  const onBorrow = useCallback(() => {
    if (!collateralReserve) {
      return;
    }

    setPendingTx(true);

    (async () => {
      try {
        await borrow(
          connection,
          wallet,

          fromAccounts[0],
          parseFloat(value),
          // TODO: switch to collateral when user is using slider
          BorrowAmountType.LiquidityBorrowAmount,
          borrowReserve,
          collateralReserve,

          // TODO: select exsisting obligations by collateral reserve
          userObligationsByReserve.length > 0
            ? userObligationsByReserve[0].obligation.account
            : undefined,

          userObligationsByReserve.length > 0
            ? userObligationsByReserve[0].userAccounts[0].pubkey
            : undefined
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
    wallet,
    value,
    collateralReserve,
    borrowReserve,
    fromAccounts,
    userObligationsByReserve,
    setPendingTx,
    setShowConfirmation,
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
          <div className="borrow-input-title">{LABELS.SELECT_COLLATERAL}</div>
          <CollateralSelector
            reserve={borrowReserve.info}
            collateralReserve={collateralReserveKey}
            onCollateralReserve={setCollateralReserveKey}
          />

          <div className="borrow-input-title">{LABELS.BORROW_QUESTION}</div>
          <div className="token-input">
            <TokenIcon mintAddress={borrowReserve?.info.liquidityMint} />
            <NumericInput
              value={value}
              onChange={(val: any) => {
                setValue(val);
              }}
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
          <ConnectButton
            type="primary"
            onClick={onBorrow}
            loading={pendingTx}
            disabled={fromAccounts.length === 0}
          >
            {fromAccounts.length === 0 ? LABELS.NO_DEPOSITS : LABELS.BORROW_ACTION}
          </ConnectButton>
          <BackButton />
        </div>
      )}
    </Card>
  );
};
