import React, { useEffect, useState } from 'react';
import { Row, Col, Divider, Layout, Image } from 'antd';
import { useParams } from 'react-router-dom';
import { useArt } from './../../hooks';

import "./index.less"
import { Art, Artist, Presale } from '../../types';
import { sampleArtist, samplePresale } from '../home/sampleData';
import { PreSaleCard } from '../../components/PresaleCard';
import { ArtContent } from '../../components/ArtContent';

const { Content } = Layout

export const ArtView = () => {
  const { id } = useParams<{ id: string }>();

  const art = useArt(id);
  // const artist: Artist = getArtist(art.artist_id)
  // const presale: Presale = getPresale(art.presale_id)
  const artist: Artist = sampleArtist
  const presale: Presale = samplePresale

  return (
    <Content>
      <Col>
        <Row>
          <ArtContent category={art.category} content={art.image} className="artwork-image" />
        </Row>
        <Divider />
        <Row style={{ margin: '0 30px', textAlign: 'left', fontSize: '1.4rem' }}>
          <Col span={24} >
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
        </Row>
      </Col>
    </Content>
  );
};
