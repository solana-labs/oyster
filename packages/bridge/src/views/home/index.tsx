import anime from 'animejs';
import React from 'react';
import { formatUSD, shortenAddress } from '@oyster/common';
import './itemStyle.less';
import './index.less';
import { Link } from 'react-router-dom';
import { useWormholeAccounts } from '../../hooks/useWormholeAccounts';
import { TokenDisplay } from '../../components/TokenDisplay';
import { toChainSymbol } from '../../contexts/chainPair';
import { AssetsTable } from '../../components/AssetsTable';

export const HomeView = () => {
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
      <div className="flexColumn home-container">
        <div className={'justify-bottom-container wormhole-bg'}>
          <div className={'main-logo'}>
            <div className={'logo-title'}>
              {' '}
              SOLANA &lt;-&gt; ETHEREUM BRIDGE
            </div>
            <img src={'/home/main-logo.svg'} />
          </div>
          <div>
            Easily move any tokens between Ethereum and Solana <br /> with
            Wormhole’s bi-directional bridge
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
              <div className={'description-text'}></div>
            </div>
            <div className={'home-description-item'}>
              <div className={'description-icon'}>
                <img src={'/home/icons/sd-card.svg'} />
              </div>
              <div className={'description-title'}>Staking & Validation</div>
              <div className={'description-text'}></div>
            </div>
            <div className={'home-description-item'}>
              <div className={'description-icon'}>
                <img src={'/home/icons/layers.svg'} />
              </div>
              <div className={'description-title'}>Layers and Capabilities</div>
              <div className={'description-text'}></div>
            </div>
          </div>
        </div>
        <AssetsTable />
      </div>
    </>
  );
};
