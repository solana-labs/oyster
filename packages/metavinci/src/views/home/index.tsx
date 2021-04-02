import React from 'react'
import { Layout } from 'antd'

import { Auction } from '../../types'
import { MainAuctionCard } from '../../components/MainAuctionCard'

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

export const HomeView = () => {

  return (
    <Layout style={{ margin: 0 }}>
      <MainAuctionCard auction={sampleAuction} />
      <Layout>
        <Content>
          <div>Top Auctions</div>
          <div>auction 1</div>
        </Content>
        <Sider>
          <div>Top Artists</div>
          <div>artist 1</div>
        </Sider>
      </Layout>
    </Layout>
  );
};
