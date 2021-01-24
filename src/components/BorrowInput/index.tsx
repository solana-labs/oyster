import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUserBalance, useUserObligationByReserve } from "../../hooks";
import {
  BorrowAmountType,
  LendingReserve,
  LendingReserveParser,
} from "../../models";
import { Card } from "antd";
import { cache, ParsedAccount } from "../../contexts/accounts";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { borrow } from "../../actions";
import "./style.less";
import { LABELS } from "../../constants";
import { ActionConfirmation } from "./../ActionConfirmation";
import { BackButton } from "./../BackButton";
import { ConnectButton } from "../ConnectButton";
import CollateralInput from "../CollateralInput";
import { ArrowDownOutlined } from "@ant-design/icons";
import { useMidPriceInUSD } from "../../contexts/market";

export const BorrowInput = (props: {
  className?: string;
  reserve: ParsedAccount<LendingReserve>;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [value, setValue] = useState("");
  const [collateralValue, setCollateralValue] = useState("");
  const [lastTyped, setLastTyped] = useState("collateral");
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

  const borrowPrice = useMidPriceInUSD(
    borrowReserve.info.liquidityMint.toBase58()
  ).price;
  const collateralPrice = useMidPriceInUSD(
    collateralReserve?.info.liquidityMint.toBase58()
  )?.price;

  useEffect(() => {
    if (collateralReserve && lastTyped === "collateral") {
      const ltv = borrowReserve.info.config.loanToValueRatio / 100;

      if (collateralValue) {
        const nCollateralValue = parseFloat(collateralValue);
        const borrowInUSD = nCollateralValue * collateralPrice * ltv;
        const borrowAmount = borrowInUSD / borrowPrice;
        setValue(borrowAmount.toString());
      } else {
        setValue("");
      }
    }
  }, [
    lastTyped,
    collateralReserve,
    collateralPrice,
    borrowPrice,
    borrowReserve,
    collateralValue,
  ]);

  useEffect(() => {
    if (collateralReserve && lastTyped === "borrow") {
      const ltv = borrowReserve.info.config.loanToValueRatio / 100;

      if (value) {
        const nValue = parseFloat(value);
        const borrowInUSD = nValue * borrowPrice;
        const collateralAmount = borrowInUSD / ltv / collateralPrice;
        setCollateralValue(collateralAmount.toString());
      } else {
        setCollateralValue("");
      }
    }
  }, [
    lastTyped,
    collateralReserve,
    collateralPrice,
    borrowPrice,
    borrowReserve,
    value,
  ]);

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
        setCollateralValue("");
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
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-evenly",
              alignItems: "center",
            }}
          >
            <CollateralInput
              title="Collateral (estimated)"
              reserve={borrowReserve.info}
              amount={parseFloat(collateralValue) || 0}
              onInputChange={(val: number | null) => {
                setCollateralValue(val?.toString() || "");
                setLastTyped("collateral");
              }}
              onCollateralReserve={(key) => {
                setCollateralReserveKey(key);
              }}
            />
          </div>
          <ArrowDownOutlined />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-evenly",
              alignItems: "center",
            }}
          >
            <CollateralInput
              title="Borrow Amount"
              reserve={borrowReserve.info}
              amount={parseFloat(value) || 0}
              onInputChange={(val: number | null) => {
                setValue(val?.toString() || "");
                setLastTyped("borrow");
              }}
              disabled={true}
              hideBalance={true}
            />
          </div>
          <ConnectButton
            size="large"
            type="primary"
            onClick={onBorrow}
            loading={pendingTx}
            disabled={fromAccounts.length === 0}
          >
            {fromAccounts.length === 0
              ? LABELS.NO_DEPOSITS
              : LABELS.BORROW_ACTION}
          </ConnectButton>
          <BackButton />
        </div>
      )}
    </Card>
  );
};
