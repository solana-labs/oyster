import React from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Divider, Layout, Image, Spin } from 'antd';
import { AuctionCard } from '../../components/AuctionCard';
import { metadataToArt, useArt, useAuction } from '../../hooks';
import { ArtContent } from '../../components/ArtContent';
import { sampleArtist } from '../home/sampleData';

const { Content } = Layout;

export const AuctionView = () => {
  const { id } = useParams<{ id: string }>();
  const auction = useAuction(id);
  const art = useArt(auction?.thumbnail.metadata.pubkey);
  const artist = sampleArtist;

  return (
    <Content>
      <Col>
        <Row>
          <ArtContent
            category={art.category}
            content={art.image}
            className="artwork-image"
          />
        </Row>
        <Divider />
        <Row
          style={{ margin: '0 30px', textAlign: 'left', fontSize: '1.4rem' }}
        >
          <Col span={12}>
            <div style={{ fontWeight: 700 }}>{art.title}</div>
            <br />
            <div className="info-header">CREATED BY</div>
            <div className="info-content">
              <img src={artist.image} className="artist-image" /> @{art.artist}
            </div>
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
          <Col span={12}>
            {auction ? <AuctionCard auctionView={auction} /> : <Spin />}
          </Col>
        </Row>
      </Col>
    </Content>
  );
};
