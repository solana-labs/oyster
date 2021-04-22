import {
  formatNumber,
  formatPct,
  TokenIcon,
  useTokenName,
} from '@oyster/common';
import { Button } from 'antd';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LABELS } from '../../../constants';
import { UserDeposit } from '../../../hooks';
import { calculateDepositAPY } from '../../../models';

export const DepositItem = (props: { userDeposit: UserDeposit }) => {
  const { reserve, info } = props.userDeposit;
  const mintAddress = reserve.info.liquidity.mint;
  const name = useTokenName(mintAddress);

  const depositAPY = useMemo(() => calculateDepositAPY(reserve.info), [
    reserve,
  ]);

  return (
    <div className="dashboard-item">
      <span style={{ display: 'flex' }}>
        <TokenIcon mintAddress={mintAddress} />
        {name}
      </span>
      <div>
        <div>
          <div>
            <em>{formatNumber.format(info.amount)}</em> {name}
          </div>
          <div className="dashboard-amount-quote">
            ${formatNumber.format(info.amountInQuote)}
          </div>
        </div>
      </div>
      <div>{formatPct.format(depositAPY)}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link to={`/deposit/${reserve.pubkey.toBase58()}`}>
          <Button type="primary">
            <span>{LABELS.DEPOSIT_ACTION}</span>
          </Button>
        </Link>
        <Link to={`/withdraw/${reserve.pubkey.toBase58()}`}>
          <Button type="text">
            <span>{LABELS.WITHDRAW_ACTION}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
