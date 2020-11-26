import React from "react";
import { useCollateralBalance, useTokenName } from "../../hooks";
import { calculateBorrowAPR, LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber, formatPct } from "../../utils/utils";
import { Button, Card } from "antd";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { LABELS } from "../../constants";

export const BorrowItem = (props: {
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const name = useTokenName(props.reserve.liquidityMint);

  // TODO: calculate avilable amount... based on total owned collateral across all the reserves
  const { balance: collateralBalance } = useCollateralBalance(props.reserve);

  const apr = calculateBorrowAPR(props.reserve);

  return (
    <Link to={`/borrow/${props.address.toBase58()}`}>
      <Card>
        <div className="borrow-item">
          <span style={{ display: "flex" }}>
            <TokenIcon mintAddress={props.reserve.liquidityMint} />
            {name}
          </span>
          <div>
            {formatNumber.format(collateralBalance)} {name}
          </div>
          <div>{formatPct.format(apr)}</div>
          <div>
            <Button>
              <span>{LABELS.BORROW_ACTION}</span>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};
