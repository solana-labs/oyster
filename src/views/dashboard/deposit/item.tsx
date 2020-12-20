import React, { useMemo } from "react";
import { useUserCollateralBalance, useTokenName } from "../../../hooks";
import { calculateDepositAPY, LendingReserve } from "../../../models/lending";
import { TokenIcon } from "../../../components/TokenIcon";
import { formatNumber, formatPct } from "../../../utils/utils";
import { Button, Card } from "antd";
import { Link } from "react-router-dom";
import { TokenAccount } from "../../../models";
import { ParsedAccount } from "../../../contexts/accounts";
import { LABELS } from "../../../constants";

export const DepositItem = (props: {
  reserve: ParsedAccount<LendingReserve>;
  account: TokenAccount;
}) => {
  const mintAddress = props.reserve.info.liquidityMint;
  const name = useTokenName(mintAddress);
  const { balance: collateralBalance } = useUserCollateralBalance(
    props.reserve.info,
    props.account.pubkey
  );

  const depositAPY = useMemo(() => calculateDepositAPY(props.reserve.info), [
    props.reserve,
  ]);

  return (
    <Card>
      <div className="dashboard-item">
        <span style={{ display: "flex" }}>
          <TokenIcon mintAddress={mintAddress} />
          {name}
        </span>
        <div>
          {formatNumber.format(collateralBalance)} {name}
        </div>
        <div>{formatPct.format(depositAPY)}</div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link to={`/deposit/${props.reserve.pubkey.toBase58()}`}>
            <Button>
              <span>{LABELS.DEPOSIT_ACTION}</span>
            </Button>
          </Link>
          <Link to={`/withdraw/${props.reserve.pubkey.toBase58()}`}>
            <Button>
              <span>{LABELS.WITHDRAW_ACTION}</span>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
