import React from 'react'
import { Layout, Row, Col } from 'antd'

import { Artist, Auction } from '../../types'
import { MainAuctionCard } from '../../components/MainAuctionCard'
import { AuctionCard } from '../../components/AuctionCard'
import { ArtistCard } from '../../components/ArtistCard'

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

const sampleArtists: Array<Artist> = [
  {
    name: "Yuzu415",
    link: "/artist/1234abcd",
    image: "http://localhost:3000/img/artist1.jpeg",
    itemsAvailable: 7,
    itemsSold: 215,
  },
  {
    name: "Mischa",
    link: "/artist/1234abcd",
    image: "http://localhost:3000/img/artist2.jpeg",
    itemsAvailable: 2,
    itemsSold: 215,
  },
  {
    name: "Sammy",
    link: "/artist/1234abcd",
    image: "http://localhost:3000/img/artist3.jpeg",
    itemsAvailable: 7,
    itemsSold: 215,
  },
  {
    name: "Wonderful",
    link: "/artist/1234abcd",
    image: "http://localhost:3000/img/artist4.jpeg",
    itemsAvailable: 7,
    itemsSold: 215,
  },
]


export const HomeView = () => {
  // TODO: fetch real data
  const auction: Auction = sampleAuction
  const auctions: Array<Auction> = sampleAuctions
  const soldAuctions: Array<Auction> = sampleAuctions.slice(0, 3)
  const artists: Array<Artist> = sampleArtists

  return (
    <Layout style={{ margin: 0 }}>
      <MainAuctionCard auction={auction} />
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
