import React from "react";
import { useTokenName } from "../../hooks";
import { calculateBorrowAPY, LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { wadToLamports, formatNumber, fromLamports } from "../../utils/utils";
import { Card } from "antd";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { useMint } from "../../contexts/accounts";
import { WAD } from "../../constants";

export const LendingReserveItem = (props: {
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const name = useTokenName(props.reserve.liquidityMint);

  const liquidityMint = useMint(props.reserve.liquidityMint);

  const totalLiquidity = fromLamports(
    props.reserve.totalLiquidity.toNumber(),
    liquidityMint
  );

  console.log(props.reserve.totalBorrowsWad.toString());
  const totalBorrows = fromLamports(wadToLamports(props.reserve.totalBorrowsWad), liquidityMint);

  console.log(liquidityMint);

  return (
    <Link to={`/reserve/${props.address.toBase58()}`}>
      <Card>
        <div className="home-item">
          <span style={{ display: "flex" }}>
            <TokenIcon mintAddress={props.reserve.liquidityMint} />
            {name}
          </span>
          <div>
            {formatNumber.format(totalLiquidity)} {name}
          </div>
          <div>
            {formatNumber.format(totalBorrows)} {name}
          </div>
          <div>--</div>
          <div>{calculateBorrowAPY(props.reserve)}</div>
        </div>
      </Card>
    </Link>
  );
};



