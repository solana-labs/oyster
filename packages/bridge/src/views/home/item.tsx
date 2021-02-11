import React, { useMemo } from 'react';
import { TokenIcon } from '../../components/TokenIcon';

import { Link } from 'react-router-dom';
import { PublicKey } from '@solana/web3.js';
import { contexts, hooks, utils } from '@oyster/common';
import { TotalItem } from '../../models/totals';
const { wadToLamports, formatNumber, fromLamports, formatPct } = utils;
const { useMint } = contexts.Accounts;
const { useTokenName } = hooks;

export const LendingReserveItem = (props: {
  address: PublicKey;
  item?: TotalItem;
}) => {
  const name = ''; //useTokenName(props.reserve.liquidityMint);

  const marketSize = 0;

  return (
    <Link to={`/reserve/${props.address.toBase58()}`}>
      <div className="home-item">
        <span style={{ display: 'flex' }}>
          <TokenIcon mintAddress={props.address.toBase58()} />
          {name}
        </span>
        <div title={marketSize.toString()}>
          <div>
            <div>
              <em>{formatNumber.format(marketSize)}</em> {name}
            </div>
            <div className="dashboard-amount-quote">
              ${formatNumber.format(props.item?.marketSize)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
