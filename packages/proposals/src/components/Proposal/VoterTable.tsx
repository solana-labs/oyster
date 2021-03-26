import React from 'react';
import { LABELS } from '../../constants';

import { Table, Grid } from 'antd';
import BN from 'bn.js';
import { VoteType } from '../../views/proposal';
import { Breakpoint } from 'antd/lib/_util/responsiveObserve';

function shortNumber(num: number) {
  if (Math.abs(num) < 1000) {
    return num;
  }

  let shortNumber;
  let exponent;
  const sign = num < 0 ? '-' : '';
  const suffixes: Record<string, number> = {
    K: 6,
    M: 9,
    B: 12,
    T: 16,
  };

  num = Math.abs(num);
  const size = Math.floor(num).toString().length;

  exponent = size % 3 === 0 ? size - 3 : size - (size % 3);
  shortNumber = Math.round(10 * (num / Math.pow(10, exponent))) / 10;
  let shortNumberAsString = '';

  for (let suffix in suffixes) {
    if (exponent < suffixes[suffix]) {
      shortNumberAsString += `${shortNumber}${suffix}`;
      break;
    }
  }

  return sign + shortNumberAsString;
}

const { useBreakpoint } = Grid;
interface IVoterTable {
  votingAccounts: Record<string, { amount: BN }>;
  yesVotingAccounts: Record<string, { amount: BN }>;
  noVotingAccounts: Record<string, { amount: BN }>;
  endpoint: string;
}

const MAX_TABLE_AMOUNT = 5000;

export const VoterTable = (props: IVoterTable) => {
  const {
    votingAccounts,
    yesVotingAccounts,
    noVotingAccounts,
    endpoint,
  } = props;
  const breakpoint = useBreakpoint();
  const subdomain = endpoint
    .replace('http://', '')
    .replace('https://', '')
    .split('.')[0];

  let total = 0;
  const mapper = (key: string, account: { amount: BN }, label: string) => {
    total += account.amount.toNumber();
    return {
      key: key,
      type: label,
      count: account.amount.toNumber(),
    };
  };

  const data = [
    ...Object.keys(votingAccounts).map(key =>
      mapper(key, votingAccounts[key], VoteType.Undecided),
    ),
    ...Object.keys(yesVotingAccounts).map(key =>
      mapper(key, yesVotingAccounts[key], VoteType.Yes),
    ),
    ...Object.keys(noVotingAccounts).map(key =>
      mapper(key, noVotingAccounts[key], VoteType.No),
    ),
  ]
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_TABLE_AMOUNT);

  const columns = [
    {
      title: LABELS.ACCOUNT,
      dataIndex: 'key',
      key: 'key',
      align: 'center',
      render: (key: string) => (
        <a
          href={`https://explorer.solana.com/address/${key}?cluster=${subdomain}`}
          target="_blank"
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
      title: LABELS.COUNT,
      dataIndex: 'count',
      key: 'count',
      align: 'center',
      render: (
        count: number,
        record: { key: string; count: number; type: VoteType },
      ) => (
        <span
          style={
            record.type == VoteType.Undecided
              ? { color: 'grey' }
              : { color: record.type === VoteType.Yes ? 'green' : 'red' }
          }
        >
          {shortNumber(count)}
        </span>
      ),
    },
    {
      title: LABELS.PERCENTAGE,
      dataIndex: 'count',
      key: 'count',
      align: 'center',
      render: (
        count: number,
        record: { key: string; count: number; type: VoteType },
      ) => (
        <span
          style={
            record.type == VoteType.Undecided
              ? { color: 'grey' }
              : { color: record.type === VoteType.Yes ? 'green' : 'red' }
          }
        >
          {Math.round((count * 100) / total)}%
        </span>
      ),
    },
  ];
  //@ts-ignore
  return <Table columns={columns} dataSource={data} />;
};
