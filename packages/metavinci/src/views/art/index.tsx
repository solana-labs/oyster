import React from 'react';
import { Row, Col, Divider, Layout } from 'antd';
import { useParams } from 'react-router-dom';
// import { useArt } from './../../hooks';

import "./index.less"
import { useMeta } from '../../contexts';

const { Content } = Layout

export const ArtView = () => {
  const { id } = useParams<{ id: string }>();
  const { metadata } = useMeta();
  let meta = metadata.find(m => m.pubkey.toBase58() === id);



  const art = {
    image: 'img/auction3.jpg',
    link: '/art/1234abcd',
    title: 'nostalgic vibes',
    artist: 'nftartist',
    priceSOL: 1.1,
    priceUSD: 24,
    endingTS: 1617680325000,

    royalties: 20,
    about: "Series of three works by Mssingno & Natalia Stuyk 'Mirada' mp4, 30fps, 1080px x 1350px April 2021",
  }

  const artist = {
    image: '/img/artist3.jpeg',
    about: "NFTARTIST is an Artist & Director working in entertainment for the past 15 years. Experience in film, commercial and live events, his work serves as a means to visual and methodological study.",
  }

  return (
    <Content>
      <Col>
        <Row>
          <img src={art.image} className="artwork-image" />
        </Row>
        <Divider />
        <Row style={{ margin: '0 30px' }}>
          <Col span={12} style={{ textAlign: 'left', fontSize: '1.4rem' }}>
            <div style={{ fontWeight: 700 }}>{art.title}</div>
            <br />
            <div className="info-header">CREATED BY</div>
            <div className="info-content"><img src={artist.image} className="artist-image" /> @{art.artist}</div>
            <br />
            <div className="info-header">CREATOR ROYALTIES</div>
            <div className="royalties">{art.royalties}%</div>
            <br />
            <div className="info-header">ABOUT THE CREATION</div>
            <div className="info-content">{art.about}</div>
            <br />
            <div className="info-header">ABOUT THE CREATOR</div>
            <div className="info-content">{artist.about}</div>
          </Col>
          <Col span={12}></Col>
        </Row>
      </Col>
    </Content>
  );
};
