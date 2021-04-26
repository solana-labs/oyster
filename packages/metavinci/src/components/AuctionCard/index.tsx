import React, { useEffect, useState } from 'react';
import { Row, Col, Divider, Button, InputNumber } from 'antd';

import { Auction, Presale } from '../../types';

import './index.less';
import { getCountdown } from '../../utils/utils';
import { shortenAddress, useConnection } from '@oyster/common';
import { AuctionView } from '../../hooks';

export const AuctionCard = ({ auctionView }: { auctionView: AuctionView }) => {
  const [hours, setHours] = useState<number>(23);
  const [minutes, setMinutes] = useState<number>(59);
  const [seconds, setSeconds] = useState<number>(59);
  const [clock, setClock] = useState<number>(0);
  const connection = useConnection();

  useEffect(() => {
    connection.getSlot().then(setClock);
  }, [connection]);

  useEffect(() => {
    const interval = setInterval(() => {
      const slotDiff =
        (auctionView.auction.info.endedAt?.toNumber() || 0) - clock;

      /* const { hours, minutes, seconds } = getCountdown(
        auctionView.auction.info.endedAt?.toNumber(),
      );

      setHours(hours);
      setMinutes(minutes);
      setSeconds(seconds);*/
      setHours(1);
    }, 1000);
    return () => clearInterval(interval);
  }, [clock]);

  return (
    <div className="presale-card-container">
      <div className="info-header">STARTING BID</div>
      <div style={{ fontWeight: 700, fontSize: '1.6rem' }}>◎40.00</div>
      <br />
      <div className="info-header">AUCTION ENDS IN</div>
      <Row style={{ width: 300 }}>
        <Col span={8}>
          <div className="cd-number">{hours || '--'}</div>
          <div className="cd-label">hours</div>
        </Col>
        <Col span={8}>
          <div className="cd-number">{minutes || '--'}</div>
          <div className="cd-label">minutes</div>
        </Col>
        <Col span={8}>
          <div className="cd-number">{seconds || '--'}</div>
          <div className="cd-label">seconds</div>
        </Col>
      </Row>
      <br />
      <div
        className="info-content"
        style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}
      >
        Any bids placed in the last 15 minutes will extend the auction for
        another 15 minutes.
      </div>
      <br />

      <div className="info-line" />

      <InputNumber
        autoFocus
        className="input"
        placeholder="Max 50 characters"
        // value={props.attributes.name}
        // onChange={info =>
        //   props.setAttributes({
        //     ...props.attributes,
        //     name: info.target.value,
        //   })
        // }
      />

      <div
        className="info-content"
        style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}
      >
        Your Balance: ◎ {0.0} (${0.0})
      </div>

      <Button
        type="primary"
        size="large"
        className="action-btn"
        style={{ marginTop: 20 }}
      >
        PLACE BID
      </Button>
    </div>
  );
};

export const AuctionBidders = (auctionID: string) => {
  const bids: any[] = [];
  return (
    <Col>
      {bids.map((bid, index) => {
        return (
          <Row>
            {index + 1}. {shortenAddress(bid.address)} {bid.amount}
          </Row>
        );
      })}
    </Col>
  );
};
