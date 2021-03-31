import { Table, Col, Row, Statistic, Button } from 'antd';
import anime from 'animejs';
import React, { useMemo } from 'react';
import { GUTTER } from '../../constants';
import { formatNumber, formatUSD, shortenAddress } from '@oyster/common';
import './index.less';
import { Link } from 'react-router-dom';

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
      </div>
    </>
  );
};
