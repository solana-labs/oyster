import React from 'react';
import { LABELS } from '../../constants';

import { Table, Grid } from 'antd';
import { VoterDisplayData, VoteType } from '../../views/proposal';

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
  data: Array<VoterDisplayData>;
  total: number;
  endpoint: string;
}

export const VoterTable = (props: IVoterTable) => {
  const { data, total, endpoint } = props;
  const breakpoint = useBreakpoint();
  const subdomain = endpoint
    .replace('http://', '')
    .replace('https://', '')
    .split('.')[0];

  const columns = [
    {
      title: LABELS.ACCOUNT,
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      render: (key: string) => (
        <a
          href={`https://explorer.solana.com/address/${key}?cluster=${subdomain}`}
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
      title: LABELS.COUNT,
      dataIndex: 'value',
      key: 'value',
      align: 'center',
      render: (count: number, record: VoterDisplayData) => (
        <span
          style={
            record.group == VoteType.Undecided
              ? { color: 'grey' }
              : { color: record.group === VoteType.Yes ? 'green' : 'red' }
          }
        >
          {shortNumber(count)}
        </span>
      ),
    },
    {
      title: LABELS.PERCENTAGE,
      dataIndex: 'value',
      key: 'value',
      align: 'center',
      render: (count: number, record: VoterDisplayData) => (
        <span
          style={
            record.group == VoteType.Undecided
              ? { color: 'grey' }
              : { color: record.group === VoteType.Yes ? 'green' : 'red' }
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
