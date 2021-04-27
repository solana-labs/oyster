import React, { useEffect, useState } from 'react';
import { Row, Col, Divider, Button, InputNumber } from 'antd';

import { Auction, Presale } from '../../types';

import './index.less';
import { getCountdown } from '../../utils/utils';
import {
  shortenAddress,
  TokenAccount,
  useConnection,
  useUserAccounts,
  hooks,
  contexts,
  cache,
  BidderMetadataParser,
  BidderMetadata,
  ParsedAccount,
} from '@oyster/common';
import { AuctionView, AuctionViewState } from '../../hooks';
import { sendPlaceBid } from '../../actions/sendPlaceBid';
import { sendRedeemBid } from '../../actions/sendRedeemBid';
const { useWallet } = contexts.Wallet;
export const AuctionCard = ({ auctionView }: { auctionView: AuctionView }) => {
  const [hours, setHours] = useState<number>(23);
  const [minutes, setMinutes] = useState<number>(59);
  const [seconds, setSeconds] = useState<number>(59);
  const [clock, setClock] = useState<number>(0);
  const connection = useConnection();
  const { wallet } = useWallet();
  const { userAccounts } = useUserAccounts();
  const [value, setValue] = useState<number>();
  const accountByMint = userAccounts.reduce((prev, acc) => {
    prev.set(acc.info.mint.toBase58(), acc);
    return prev;
  }, new Map<string, TokenAccount>());

  const myPayingAccount = accountByMint.get(
    auctionView.auction.info.tokenMint.toBase58(),
  );
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
        value={value}
        style={{ width: '100%', backgroundColor: 'black', marginTop: 20 }}
        onChange={setValue}
      />

      <div
        className="info-content"
        style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}
      >
        Your Balance: $
        {myPayingAccount ? myPayingAccount.info.amount.toNumber() : 0.0}
      </div>

      {auctionView.state == AuctionViewState.Ended ? (
        <Button
          type="primary"
          size="large"
          className="action-btn"
          disabled={!auctionView.myBidderMetadata}
          onClick={() => {
            console.log('Auctionview', auctionView);
            sendRedeemBid(connection, wallet, auctionView, accountByMint);
          }}
          style={{ marginTop: 20 }}
        >
          REDEEM BID
        </Button>
      ) : (
        <Button
          type="primary"
          size="large"
          className="action-btn"
          disabled={!myPayingAccount || value === undefined}
          onClick={() => {
            console.log('Auctionview', auctionView);
            if (myPayingAccount && value)
              sendPlaceBid(
                connection,
                wallet,
                myPayingAccount.pubkey,
                auctionView,
                value,
              );
          }}
          style={{ marginTop: 20 }}
        >
          PLACE BID
        </Button>
      )}
      <AuctionBids view={auctionView} />
    </div>
  );
};

export const AuctionBids = ({view}: {view : AuctionView}) => {
  const bids = cache.byParser(BidderMetadataParser).filter(id => {
    const bidder = cache.get(id) as ParsedAccount<BidderMetadata>;
    if(!bidder) {
      return false;
    }

    return bidder.info.auctionPubkey.toBase58() === view.auction.pubkey.toBase58();
  }).map(id => {
    const bidder = cache.get(id) as ParsedAccount<BidderMetadata>;
    return bidder;
  })

  return (
    <Col style={{ width: '100%' }}>
      {bids.map((bid, index) => {
        return (
          <Row>
            <Col span={2}>{index + 1}.</Col>
            <Col span={17}>{shortenAddress(bid.info.bidderPubkey.toBase58())}</Col>
            <Col span={5} style={{ textAlign: 'right' }}>{bid.info.lastBid.toString()}</Col>
          </Row>
        );
      })}
    </Col>
  );
};
