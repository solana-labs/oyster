import { contexts, fromLamports, wadToLamports } from '@oyster/common';
import { Statistic } from 'antd';
import React, { useMemo } from 'react';
import { Reserve } from '../../models';
import { WaterWave } from './../WaterWave';

const { useMint } = contexts.Accounts;

export const ReserveUtilizationChart = (props: { reserve: Reserve }) => {
  const mintAddress = props.reserve.liquidity.mint?.toBase58();
  const liquidityMint = useMint(mintAddress);
  const availableAmount = fromLamports(
    props.reserve.liquidity.availableAmount,
    liquidityMint,
  );

  const totalBorrows = useMemo(
    () =>
      fromLamports(
        wadToLamports(props.reserve.liquidity.borrowedAmountWads),
        liquidityMint,
      ),
    [props.reserve, liquidityMint],
  );

  const totalSupply = availableAmount + totalBorrows;
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
