import React, { useState } from 'react';
import { Layout, Row, Col, Tabs } from 'antd';
import Masonry from 'react-masonry-css';

import { PreSaleBanner } from '../../components/PreSaleBanner';
import { AuctionViewState, useArt, useAuctions } from '../../hooks';

import './index.less';
import { ArtCard } from '../../components/ArtCard';
import { Link } from 'react-router-dom';

const { TabPane } = Tabs;

const { Content } = Layout;
export const HomeView = () => {
  const [activeKey, setActiveKey] = useState(AuctionViewState.Live);
  const auctions = useAuctions(activeKey);
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  const auctionGrid = (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
      {auctions.map(m => {
        const id = m.auction.pubkey.toBase58();
        return (
          <Link to={`/auction/${id}`}>
            <ArtCard
              key={id}
              image={m.thumbnail.metadata.info.extended?.image}
              category={m.thumbnail.metadata.info.extended?.category}
              name={m.thumbnail.metadata?.info.name}
              symbol={m.thumbnail.metadata?.info.symbol}
              description={m.thumbnail.metadata?.info.extended?.description}
              endAuctionAt={m.auction.info.endAuctionAt?.toNumber()}
              pubkey={m.thumbnail.metadata.pubkey}
              preview={false}
            />
          </Link>
        );
      })}
    </Masonry>
  );

  return (
    <Layout style={{ margin: 0, marginTop: 30 }}>
      <PreSaleBanner
        artistName={'RAC'}
        productName={'THE BOY COLLECTION'}
        preSaleTS={1620009209}
        image="img/banner1.jpeg"
      />
      <Layout>
        <Content style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Col style={{ width: '100%', marginTop: 10 }}>
            <Row>
              <Tabs
                activeKey={activeKey}
                onTabClick={key => setActiveKey(key as AuctionViewState)}
              >
                <TabPane
                  tab={<span className="tab-title">Live</span>}
                  key={AuctionViewState.Live}
                >
                  {auctionGrid}
                </TabPane>
                <TabPane
                  tab={<span className="tab-title">Upcoming</span>}
                  key={AuctionViewState.Upcoming}
                >
                  {auctionGrid}
                </TabPane>
                <TabPane
                  tab={<span className="tab-title">Ended</span>}
                  key={AuctionViewState.Ended}
                >
                  {auctionGrid}
                </TabPane>
                <TabPane
                  tab={<span className="tab-title">Buy Now</span>}
                  key={AuctionViewState.BuyNow}
                >
                  {auctionGrid}
                </TabPane>
              </Tabs>
            </Row>
          </Col>
        </Content>
      </Layout>
    </Layout>
  );
};
