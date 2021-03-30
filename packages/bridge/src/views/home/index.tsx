import { Table, Col, Row, Statistic, Button } from 'antd';
import anime from 'animejs';
import React, { useMemo } from 'react';
import { GUTTER } from '../../constants';
import { formatNumber, formatUSD, shortenAddress } from '@oyster/common';
import './itemStyle.less';
import './index.less';
import { Link } from 'react-router-dom';
import { useWormholeAccounts } from '../../hooks/useWormholeAccounts';
import { TokenDisplay } from '../../components/TokenDisplay';
import { toChainSymbol } from '../../contexts/chainPair';

export const HomeView = () => {
  const {
    loading: loadingLockedAccounts,
    externalAssets,
    totalInUSD,
  } = useWormholeAccounts();

  const columns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render(text: string, record: any) {
        return {
          props: {
            style: {},
          },
          children: (
            <Link
              to={`/move?from=${toChainSymbol(record.chain)}&token=${
                record.symbol
              }`}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {record.logo && (
                  <TokenDisplay logo={record.logo} chain={record.chain} />
                )}{' '}
                {record.symbol}
              </span>
            </Link>
          ),
        };
      },
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Amount ($)',
      dataIndex: 'amountInUSD',
      key: 'amountInUSD',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      width: 100,
      key: 'price',
      render(text: string, record: any) {
        return {
          props: {
            style: { textAlign: 'right' },
          },
          children: record.price ? formatUSD.format(record.price) : '--',
        };
      },
    },
    {
      title: 'Asset Address',
      dataIndex: 'address',
      key: 'address',
      render(text: string, record: any) {
        return {
          props: {
            style: {},
          },
          children: (
            <a href={record.explorer} target="_blank" rel="noopener noreferrer">
              {shortenAddress(text, 6)}
            </a>
          ),
        };
      },
    },
    {
      title: 'Wrapped Address',
      dataIndex: 'mintKey',
      key: 'mintKey',
      render(text: string, record: any) {
        return {
          props: {
            style: {},
          },
          children: (
            <a
              href={record.wrappedExplorer}
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortenAddress(text, 6)}
            </a>
          ),
        };
      },
    },
  ];
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
            scroll={{
              scrollToFirstRowOnChange: false,
            }}
            dataSource={externalAssets.filter(a => a.name)}
            columns={columns}
            loading={loadingLockedAccounts}
          />
        </div>
      </div>
    </>
  );
};
