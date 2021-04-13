import { Table } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import { useWormholeAccounts } from '../../hooks/useWormholeAccounts';
import { TokenDisplay } from '../../components/TokenDisplay';
import { toChainSymbol } from '../../contexts/chainPair';
import { formatUSD, shortenAddress } from '@oyster/common';
import { useWormholeTransactions } from '../../hooks/useWormholeTransactions';

export const RecentTransactionsTable = () => {
  const {
    loading: loadingLockedAccounts,
    transfers,
    totalInUSD,
  } = useWormholeTransactions();

  const columns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
    },
  ];
  return (
    <div id={'recent-tx-container'}>
      <div className={'home-subtitle'}>Recent Transactions</div>
      <div className={'description-text'} style={{ marginBottom: '70px' }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </div>
      <Table
        scroll={{
          scrollToFirstRowOnChange: false,
          x: 900,
        }}
        dataSource={transfers.filter(a => a.symbol)}
        columns={columns}
        loading={loadingLockedAccounts}
      />
    </div>
  );
};
