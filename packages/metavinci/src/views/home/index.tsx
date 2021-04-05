import React from 'react'
import { Layout, Row, Col } from 'antd'

import { Artist, Auction } from '../../types'
import { PreSaleBanner } from '../../components/PreSaleBanner'
import { AuctionCard } from '../../components/AuctionCard'
import { ArtistCard } from '../../components/ArtistCard'
import { sampleAuction, sampleAuctions, sampleArtists } from './sampleData'

import './index.less'

const { Content, Sider } = Layout


export const HomeView = () => {
  // TODO: fetch real data
  const auction: Auction = sampleAuction
  const auctions: Array<Auction> = sampleAuctions
  const soldAuctions: Array<Auction> = sampleAuctions.slice(0, 3)
  const artists: Array<Artist> = sampleArtists

  return (
    <Layout style={{ margin: 0 }}>
      <PreSaleBanner
        artistName={"RAC"}
        productName={"THE BOY COLLECTION"}
        preSaleTS={1618690343000}
        image="http://localhost:3000/img/banner1.jpeg"
      />
      <Layout>
        <Content style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Col>
            <Row style={{ marginBottom: 10 }}>Trending Auctions</Row>
            <Row gutter={16} justify="space-around" style={{ marginRight: 0 }}>
              {auctions.map((auction, idx) => (
                <Col key={idx} className="gutter-row" style={{ marginBottom: 15 }}>
                  <AuctionCard auction={auction} />
                </Col>
              ))}
            </Row>
            <Row style={{ marginBottom: 10 }}>Recently Sold</Row>
            <Row gutter={16} justify="space-around" style={{ marginRight: 0 }}>
              {soldAuctions.map((auction, idx) => (
                <Col key={idx} className="gutter-row" style={{ marginBottom: 15 }}>
                  <AuctionCard auction={auction} sold={true} />
                </Col>
              ))}
            </Row>
          </Col>
        </Content>
        <Sider breakpoint="md" collapsedWidth="0">
          <Col>
            <Row style={{ marginBottom: 10 }}>Top Artists</Row>
            {artists.map((artist, idx) => (
              <Row key={idx} style={{ backgroundColor: "#222222" }}>
                <ArtistCard artist={artist} />
              </Row>
            ))}
          </Col>
        </Sider>
      </Layout>
    </Layout>
  );
};
