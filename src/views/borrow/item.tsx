import React, { useMemo } from "react";
import {
  useCollateralBalance,
  useLendingReserves,
  useTokenName,
} from "../../hooks";
import { calculateBorrowAPY, LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber, formatPct } from "../../utils/utils";
import { Button, Card } from "antd";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { LABELS } from "../../constants";
import { useMidPriceInUSD } from "../../contexts/market";

export const BorrowItem = (props: {
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const price = useMidPriceInUSD(props.reserve.liquidityMint.toBase58()).price;

  // TODO: calculate avilable amount... based on total owned collateral across all the reserves
  const { balance: collateralBalance } = useCollateralBalance(props.reserve);

  const apr = calculateBorrowAPY(props.reserve);

  return (
    <Link to={`/borrow/${props.address.toBase58()}`}>
      <Card>
        <div className="borrow-item">
          <span style={{ display: "flex" }}>
            <TokenIcon mintAddress={props.reserve.liquidityMint} />
            {name}
          </span>
          <div>{formatNumber.format(price)} USDC</div>
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
