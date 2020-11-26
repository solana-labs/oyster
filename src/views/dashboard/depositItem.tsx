import React from "react";
import { useCollateralBalance, useTokenName } from "../../hooks";
import { LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber } from "../../utils/utils";
import { Button, Card } from "antd";
import { Link } from "react-router-dom";
import { TokenAccount } from "../../models";
import { ParsedAccount } from "../../contexts/accounts";

export const DepositItem = (props: {
  reserve: ParsedAccount<LendingReserve>;
  account: TokenAccount;
}) => {
  const mintAddress = props.reserve.info.liquidityMint;
  const name = useTokenName(mintAddress);
  const { balance: collateralBalance } = useCollateralBalance(
    props.reserve.info,
    props.account.pubkey
  );

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
        <div>--</div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link to={`/deposit/${props.reserve.pubkey.toBase58()}`}>
            <Button>
              <span>Deposit</span>
            </Button>
          </Link>
          <Link to={`/withdraw/${props.reserve.pubkey.toBase58()}`}>
            <Button>
              <span>Withdraw</span>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
