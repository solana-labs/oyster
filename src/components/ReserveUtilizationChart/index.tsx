import React, { useMemo } from "react";
import { LendingReserve } from "../../models/lending";
import {
  fromLamports,
  wadToLamports,
} from "../../utils/utils";
import { useMint } from "../../contexts/accounts";
import { WaterWave } from "./../WaterWave";

export const ReserveUtilizationChart = (props: { reserve: LendingReserve }) => {
  const liquidityMint = useMint(props.reserve.liquidityMint);
  const availableLiquidity = fromLamports(
    props.reserve.availableLiquidity.toNumber(),
    liquidityMint
  );

  const totalBorrows = useMemo(
    () =>
      fromLamports(
        wadToLamports(props.reserve.borrowedLiquidityWad),
        liquidityMint
      ),
    [props.reserve, liquidityMint]
  );

  return <WaterWave
    style={{ height: 300 }}
    percent={availableLiquidity * 100 / (availableLiquidity + totalBorrows)} />;
};
