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
import { Button, Card } from "antd";
import { cache, ParsedAccount } from "../../contexts/accounts";
import { NumericInput } from "../Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { borrow } from "../../actions";
import { CollateralSelector } from "./../CollateralSelector";
import "./style.less";
import { LABELS } from "../../constants";

export const BorrowInput = (props: {
  className?: string;
  reserve: ParsedAccount<LendingReserve>;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [value, setValue] = useState("");

  const borrowReserve = props.reserve;

  const [collateralReserveMint, setCollateralReserveMint] = useState<string>();

  const collateralReserve = useMemo(() => {
    const id: string =
      cache
        .byParser(LendingReserveParser)
        .find((acc) => acc === collateralReserveMint) || "";

    return cache.get(id) as ParsedAccount<LendingReserve>;
  }, [collateralReserveMint]);

  const name = useTokenName(borrowReserve?.info.liquidityMint);
  const { accounts: fromAccounts } = useUserBalance(
    collateralReserve?.info.collateralMint
  );

  const { userObligationsByReserve } = useUserObligationByReserve(
    borrowReserve.pubkey
  );

  const onBorrow = useCallback(() => {
    if (!collateralReserve) {
      return;
    }

    borrow(
      connection,
      wallet,

      fromAccounts[0],
      parseFloat(value),
      // TODO: switch to collateral when user is using slider
      BorrowAmountType.LiquidityBorrowAmount,
      borrowReserve,
      collateralReserve,

      userObligationsByReserve.length > 0
        ? userObligationsByReserve[0].obligation
        : undefined,

      userObligationsByReserve.length > 0
        ? userObligationsByReserve[0].userAccounts[0].pubkey
        : undefined
    );
  }, [
    connection,
    wallet,
    value,
    collateralReserve,
    borrowReserve,
    fromAccounts,
    userObligationsByReserve,
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
        <div className="borrow-input-title">{LABELS.BORROW_QUESTION}</div>
        <div className="token-input">
          <TokenIcon mintAddress={borrowReserve?.info.liquidityMint} />
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
        <div className="borrow-input-title">{LABELS.SELECT_COLLATERAL}</div>
        <CollateralSelector
          reserve={borrowReserve.info}
          mint={collateralReserveMint}
          onMintChange={setCollateralReserveMint}
        />

        <Button
          type="primary"
          onClick={onBorrow}
          disabled={fromAccounts.length === 0}
        >
          {LABELS.BORROW_ACTION}
        </Button>
      </div>
    </Card>
  );
};
