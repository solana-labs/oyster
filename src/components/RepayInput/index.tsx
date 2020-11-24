import React, { useCallback, useMemo, useState } from "react";
import { useAccountByMint, useTokenName, useUserBalance } from "../../hooks";
import {
  LendingObligation,
  LendingReserve,
  LendingReserveParser,
} from "../../models";
import { TokenIcon } from "../TokenIcon";
import { Button, Card, Slider } from "antd";
import { cache, ParsedAccount, useMint } from "../../contexts/accounts";
import { NumericInput } from "../Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { repay } from "../../actions";
import { CollateralSelector } from "./../CollateralSelector";
import "./style.less";
import { decimalToLamports, formatNumber, fromLamports, toLamports } from "../../utils/utils";

export const RepayInput = (props: {
  className?: string;
  reserve: ParsedAccount<LendingReserve>;
  obligation?: ParsedAccount<LendingObligation>;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [value, setValue] = useState("");

  const repayReserve = props.reserve;
  const obligation = props.obligation;

  const [collateralReserveMint, setCollateralReserveMint] = useState<string>();

  const collateralReserve = useMemo(() => {
    const id: string =
      cache
        .byParser(LendingReserveParser)
        .find((acc) => acc === collateralReserveMint) || "";

    return cache.get(id) as ParsedAccount<LendingReserve>;
  }, [collateralReserveMint]);

  const name = useTokenName(repayReserve?.info.liquidityMint);
  const { accounts: fromAccounts, balance } = useUserBalance(
    repayReserve.info.liquidityMint
  );

  const repayLiquidityMint = useMint(repayReserve.info.liquidityMint);
  // const collateralBalance = useUserBalance(reserve?.collateralMint);

  const obligationAccount = useAccountByMint(obligation?.info.tokenMint);

  const lamports = useMemo(() => toLamports(parseFloat(value), repayLiquidityMint), [value, repayLiquidityMint]);

  const mark = decimalToLamports(obligation?.info.borrowAmount).toNumber() / lamports * 100;

  const onReoay = useCallback(() => {
    if (
      !collateralReserve ||
      !obligation ||
      !repayReserve ||
      !obligationAccount
    ) {
      return;
    }

    repay(
      fromAccounts[0],
      lamports,
      obligation,
      obligationAccount,
      repayReserve,
      collateralReserve,
      connection,
      wallet
    );
  }, [
    lamports,
    connection,
    wallet,
    obligation,
    collateralReserve,
    repayReserve,
    fromAccounts,
    obligationAccount,
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
          How much would you like to repay? (Currently:{" "}
          {formatNumber.format(balance)} {name})
        </div>
        <div className="token-input">
          <TokenIcon mintAddress={repayReserve?.info.liquidityMint} />
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
        <Slider marks={marks} 
          value={mark} 
          onChange={(val: number) => 
          setValue((fromLamports(decimalToLamports(obligation?.info.borrowAmount).toNumber(), repayLiquidityMint) * val / 100).toFixed(2))} />
        <div className="repay-input-title">Select collateral account?</div>
        <CollateralSelector
          reserve={repayReserve.info}
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

const marks = {
  0: '0%',
  25: '25%',
  50: '50%',
  75: '75%',
  100: '100%'
};
