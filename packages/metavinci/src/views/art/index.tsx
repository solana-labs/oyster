import React, { useEffect, useState } from 'react';
import { Row, Col, Divider, Layout } from 'antd';
import { useParams } from 'react-router-dom';
// import { useArt } from './../../hooks';

import "./index.less"
import { Art, Artist, Presale } from '../../types';
import { sampleArt, sampleArtist, samplePresale } from '../home/sampleData';
import { PreSaleCard } from '../../components/PresaleCard';
import { useMeta } from '../../contexts';

const { Content } = Layout

export const ArtView = () => {
  const { id } = useParams<{ id: string }>();
  const { metadata } = useMeta();
  let meta = metadata.find(m => m.pubkey.toBase58() === id);
  
  // const art: Art = useArt(id);
  // const artist: Artist = getArtist(art.artist_id)
  // const presale: Presale = getPresale(art.presale_id)
  const art: Art = sampleArt
  const artist: Artist = sampleArtist
  const presale: Presale = samplePresale

  return (
    <Content>
      <Col>
        <Row>
          <img src={art.image} className="artwork-image" />
        </Row>
        <Divider />
        <Row style={{ margin: '0 30px', textAlign: 'left', fontSize: '1.4rem' }}>
          <Col span={12} >
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
          <Col span={12}>
            <PreSaleCard presale={presale} />
          </Col>
        </Row>
      </Col>
    </Content>
  );
};
