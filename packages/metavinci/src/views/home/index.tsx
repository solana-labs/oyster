import React from 'react'
import { Layout, Card, Avatar } from 'antd'

import { Auction } from '../../types'
import { MainAuctionCard } from '../../components/MainAuctionCard'
import './index.less'
const { Meta } = Card;

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

const ExampleCard = () => {
  return <Card
  className="custom-card"
  cover={
    <img
      alt="example"
      src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
    />
  }
>
  <Meta
    avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
    title="Card title"
    description="This is the description"
  />
</Card>;
}

export const HomeView = () => {

  return (
    <Layout style={{ margin: 0 }}>
      <MainAuctionCard auction={sampleAuction} />
      <Layout>
        <Content style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'space-between', flexWrap: 'wrap' }}>
          <ExampleCard />
          <ExampleCard />
          <ExampleCard />
          <ExampleCard />
          <ExampleCard />
          <ExampleCard />
          <ExampleCard />
          <ExampleCard />
        </Content>
      </Layout>
    </Layout>
  );
};
