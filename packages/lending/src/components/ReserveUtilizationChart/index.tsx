import React, { useMemo } from 'react';
import { LendingReserve } from '../../models/lending';
import { contexts, utils } from '@oyster/common';
import { WaterWave } from './../WaterWave';
import { Statistic } from 'antd';

const { fromLamports, wadToLamports } = utils;
const { useMint } = contexts.Accounts;

export const ReserveUtilizationChart = (props: { reserve: LendingReserve }) => {
  const mintAddress = props.reserve.liquidityMint?.toBase58();
  const liquidityMint = useMint(mintAddress);
  const availableLiquidity = fromLamports(
    props.reserve.state.availableLiquidity,
    liquidityMint,
  );

  const totalBorrows = useMemo(
    () =>
      fromLamports(
        wadToLamports(props.reserve.state.borrowedLiquidityWad),
        liquidityMint,
      ),
    [props.reserve, liquidityMint],
  );

  const totalSupply = availableLiquidity + totalBorrows;
  const percent = (100 * totalBorrows) / totalSupply;

  return (
    <WaterWave
      style={{ height: 300 }}
      showPercent={false}
      title={
        <Statistic
          title="Utilization"
          value={percent}
          suffix="%"
          precision={2}
        />
      }
      percent={percent}
    />
  );
};
