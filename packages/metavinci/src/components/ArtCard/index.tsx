import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, Avatar } from 'antd';

const { Meta } = Card;

export const ArtCard = () => {
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
