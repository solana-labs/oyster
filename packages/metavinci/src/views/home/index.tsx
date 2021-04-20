import React, { useState } from 'react'
import { Layout, Row, Col, Tabs } from 'antd'
import Masonry from 'react-masonry-css'

import { PreSaleBanner } from '../../components/PreSaleBanner'
import { AuctionState, useAuctions } from '../../hooks'

import './index.less'
import { ArtCard } from '../../components/ArtCard'
import { Link } from 'react-router-dom'
import { useTorus } from '../../contexts/torus'

const { TabPane } = Tabs;

const { Content } = Layout
export const HomeView = () => {
  const [activeKey, setActiveKey] = useState(AuctionState.Live);
  const auctions = useAuctions(AuctionState.Live)
  // const torus = useTorus()
  // console.log({torus})

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  }

  const auctionGrid = <Masonry
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
    {auctions.map(m => {
      const id = m.pubkey.toBase58();
      return <Link to={`/art/${id}`}>
        <ArtCard key={id}
          image={m.info.extended?.image}
          category={m.info.extended?.category}
          name={m.info?.name}
          symbol={m.info.symbol}
          description={m.info.extended?.description}
          preview={false} />
        </Link>
    })}
    </Masonry>;

  return (
    <Layout style={{ margin: 0, marginTop: 30 }}>
      <PreSaleBanner
        artistName={"RAC"}
        productName={"THE BOY COLLECTION"}
        preSaleTS={1618690343000}
        image="img/banner1.jpeg"
      />
      <Layout>
        <Content style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Col style={{ width: '100%', marginTop: 10 }}>
            <Row>
              <Tabs activeKey={activeKey} onTabClick={(key) => setActiveKey(key as AuctionState)}>
                <TabPane
                  tab={<span className="tab-title">Live</span>}
                  key={AuctionState.Live}
                >
                  {auctionGrid}
                </TabPane>
                <TabPane
                  tab={<span className="tab-title">Upcoming</span>}
                  key={AuctionState.Upcoming}
                >
                  {auctionGrid}
                </TabPane>
                <TabPane
                  tab={<span className="tab-title">Ended</span>}
                  key={AuctionState.Ended}
                >
                  {auctionGrid}
                </TabPane>
                <TabPane
                  tab={<span className="tab-title">Buy Now</span>}
                  key={AuctionState.BuyNow}
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
