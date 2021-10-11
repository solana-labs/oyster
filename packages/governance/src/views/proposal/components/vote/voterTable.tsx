import React from 'react';
import { LABELS } from '../../../../constants';

import { Table, Grid } from 'antd';
import { VoterDisplayData, VoteType } from '../../proposalView';
import BN from 'bn.js';
import { BigNumber } from 'bignumber.js';
import { utils } from '@oyster/common';
import { formatPercentage } from '../../../../tools/units';

const { getExplorerUrl } = utils;

const { useBreakpoint } = Grid;
interface VoterTableProps {
  data: Array<VoterDisplayData>;
  total: BN;
  endpoint: string;
  decimals: number;
}

export const VoterTable = (props: VoterTableProps) => {
  const { data, total, endpoint, decimals } = props;
  const breakpoint = useBreakpoint();

  const columns = [
    {
      title: LABELS.ACCOUNT,
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      render: (key: string) => (
        <a
          href={getExplorerUrl(key, endpoint)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {breakpoint.xxl && (
            <span>
              {key.slice(0, 8) + '...' + key.slice(key.length - 8, key.length)}
            </span>
          )}
          {!breakpoint.xxl && breakpoint.xl && (
            <span>
              {key.slice(0, 5) + '...' + key.slice(key.length - 5, key.length)}
            </span>
          )}
          {!breakpoint.xxl && !breakpoint.xl && !breakpoint.xs && (
            <span>
              {key.slice(0, 3) + '...' + key.slice(key.length - 3, key.length)}
            </span>
          )}
          {breakpoint.xs && <span>{key.slice(0, 3) + '...'}</span>}
        </a>
      ),
    },
    {
      title: LABELS.VOTE_WEIGHT,
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      render: (count: BN, record: VoterDisplayData) => (
        <span
          style={
            record.group === VoteType.Undecided
              ? { color: 'grey' }
              : { color: record.group === VoteType.Yes ? 'green' : '#d32029' }
          }
        >
          {new BigNumber(count.toString()).shiftedBy(-decimals).toFormat()}
        </span>
      ),
    },
    {
      title: LABELS.PERCENTAGE,
      dataIndex: 'value',
      key: 'percentage',
      align: 'right',
      render: (count: BN, record: VoterDisplayData) => (
        <span
          style={
            record.group === VoteType.Undecided
              ? { color: 'grey' }
              : { color: record.group === VoteType.Yes ? 'green' : '#d32029' }
          }
        >
          {formatPercentage(
            new BigNumber(count.toString())
              .shiftedBy(2)
              .dividedBy(new BigNumber(total.toString()))
              .toNumber(),
          )}
        </span>
      ),
    },
  ];
  //@ts-ignore
  return <Table columns={columns} dataSource={data} />;
};
