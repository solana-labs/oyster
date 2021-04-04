import React from 'react'
import { Layout, Row, Col } from 'antd'

import { Auction } from '../../types'
import { MainAuctionCard } from '../../components/MainAuctionCard'
import { AuctionCard } from '../../components/AuctionCard'

import './index.less'

const { Content, Sider } = Layout

const sampleAuction: Auction = {
  name: "Liquidity Pool",
  auctionerName: "Rama XI",
  auctionerLink: "/address/4321dcba",
  highestBid: 23000,
  solAmt: 200,
  link: "/auction/1234abcd",
  image: "http://localhost:3000/img/auction1.jpg",
}

const sampleAuctions: Array<Auction> = [
  {
    name: "Team Trees",
    auctionerName: "NFToros",
    auctionerLink: "/address/4321dcba",
    highestBid: 23000,
    solAmt: 115,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction2.jpg",
  },
  {
    name: "Miko 4",
    auctionerName: "Hello World",
    auctionerLink: "/address/4321dcba",
    highestBid: 13000,
    solAmt: 75,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction3.jpg",
  },
  {
    name: "Tell Me",
    auctionerName: "Supper Club",
    auctionerLink: "/address/4321dcba",
    highestBid: 24000,
    solAmt: 120,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction4.jpg",
  },
  {
    name: "Saucy",
    auctionerName: "Mr. Momo",
    auctionerLink: "/address/4321dcba",
    highestBid: 23000,
    solAmt: 200,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction5.jpg",
  },
  {
    name: "Haze",
    auctionerName: "Daily Dose",
    auctionerLink: "/address/4321dcba",
    highestBid: 23000,
    solAmt: 200,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction6.jpg",
  },
  {
    name: "Wounderground",
    auctionerName: "The Maze",
    auctionerLink: "/address/4321dcba",
    highestBid: 23000,
    solAmt: 200,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction7.jpg",
  },
]

export const HomeView = () => {
  // TODO: fetch real auctions
  const auction = sampleAuction
  const auctions = sampleAuctions

  return (
    <Layout style={{ margin: 0 }}>
      <MainAuctionCard auction={auction} />
      <Layout>
        <Content>
          <Col>
            <Row style={{ marginBottom: 10 }}>Trending Auctions</Row>
            <Row gutter={16} justify="space-around" style={{ marginRight: 0 }}>
              {auctions.map(auction => (
                <Col className="gutter-row" style={{ marginBottom: 15 }}>
                  <AuctionCard auction={auction} />
                </Col>
              ))}
            </Row>
          </Col>
        </Content>
        <Sider breakpoint="md" collapsedWidth="0">
          <div>Trending Artists</div>
          <div>artist 1</div>
        </Sider>
      </Layout>
    </Layout>
  );
};
