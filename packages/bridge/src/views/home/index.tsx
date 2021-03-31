import { Table, Col, Row, Statistic, Button } from 'antd';
import React, { useMemo } from 'react';
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import anime from 'animejs';
import { GUTTER } from '../../constants';
import { formatNumber, formatUSD, shortenAddress } from '@oyster/common';
import './itemStyle.less';
import './index.less';
import { Link } from 'react-router-dom';
import { useWormholeTransactions } from '../../hooks/useWormholeTransactions';
import { TokenDisplay } from '../../components/TokenDisplay';
import { toChainSymbol } from '../../contexts/chainPair';

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

export const HomeView = () => {
  const {
    loading: loadingLockedAccounts,
    transfers,
    totalInUSD,
  } = useWormholeTransactions();

  const columns = [
    {
      title: '',
      dataIndex: 'logo',
      key: 'logo',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: (
            <Link to={`/move?from=${toChainSymbol(record.chain)}&token=${record.symbol}`}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {record.logo && <TokenDisplay logo={record.logo} chain={record.chain} />}
              </span>
            </Link>
          ),
        }
      }
    },
    {
      title: 'Asset',
      dataIndex: 'symbol',
      key: 'symbol',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: (
            <Link to={`/move?from=${toChainSymbol(record.chain)}&token=${record.symbol}`}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {record.symbol}
              </span>
            </Link>
          ),
        };
      },
    },
    {
      title: 'Tokens moved',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: '$, value',
      dataIndex: 'value',
      key: 'value',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: record.value ? formatUSD.format(record.value) : '--',
        };
      },
    },
    {
      title: 'TX hash',
      dataIndex: 'txhash',
      key: 'txhash',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: (
            <a href={record.explorer} target="_blank" rel="noopener noreferrer">
              {shortenAddress(text, 6)}
            </a>
          ),
        };
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: timeAgo.format(new Date(record.date * 1000)),
        };
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
  ]

  const handleDownArrow = () => {
    const scrollTo = document.getElementById('how-it-works-container');
    const scrollElement =
      window.document.scrollingElement ||
      window.document.body ||
      window.document.documentElement;
    anime({
      targets: scrollElement,
      scrollTop: scrollTo?.offsetTop,
      duration: 1000,
      easing: 'easeInOutQuad',
    });
  };

  return (
    <>
      <div className="flexColumn home-container wormhole-bg">
        <div className={'justify-bottom-container'}>
          <div>
            A decentralized and bi-directional bridge for
            <br /> ERC-20 and SPL tokens
          </div>
          <div className={'grow-effect'}>
            <Link to="/move">
              <span className={'get-started'}></span>
            </Link>
          </div>
          <div
            className={'grow-effect'}
            onClick={() => {
              handleDownArrow();
            }}
          >
            <span className={'down-arrow'}></span>
          </div>
        </div>
        <div id="how-it-works-container">
          <div className={'home-subtitle'}>How it works</div>
          <div className={'home-description'}>
            <div className={'home-description-item'}>
              <div className={'description-icon'}>
                <img src={'/home/icons/bridge-direction.svg'} />
              </div>
              <div className={'description-title'}>Bridge in any direction</div>
              <div className={'description-text'}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
                nisi at praesent sed sollicitudin ullamcorper malesuada in.
                Molestie sed morbi vitae in amet ultrices.
              </div>
            </div>
            <div className={'home-description-item'}>
              <div className={'description-icon'}>
                <img src={'/home/icons/sd-card.svg'} />
              </div>
              <div className={'description-title'}>Staking & Validation</div>
              <div className={'description-text'}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
                nisi at praesent sed sollicitudin ullamcorper malesuada in.
                Molestie sed morbi vitae in amet ultrices.
              </div>
            </div>
            <div className={'home-description-item'}>
              <div className={'description-icon'}>
                <img src={'/home/icons/layers.svg'} />
              </div>
              <div className={'description-title'}>Layers and Capabilities</div>
              <div className={'description-text'}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
                nisi at praesent sed sollicitudin ullamcorper malesuada in.
                Molestie sed morbi vitae in amet ultrices.
              </div>
            </div>
          </div>
        </div>
        <div id={'recent-tx-container'}>
          <div className={'home-subtitle'}>Recent Transactions</div>
          <div className={'description-text'} style={{ marginBottom: '70px' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </div>

          <Table
            scroll={{ scrollToFirstRowOnChange: false }}
            dataSource={transfers.filter(a => a.symbol).sort((a, b) => b.date - a.date)}
            columns={columns}
            loading={loadingLockedAccounts}
          />

        </div>
      </div>
    </>
  );
};
