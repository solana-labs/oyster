import React from 'react';
import { Row, Col, Card } from 'antd';
import { useParams } from 'react-router-dom';
import { useArt } from './../../hooks';

export const ArtView = () => {
  const { id } = useParams<{ id: string }>();
  const art = useArt(id);

  const image = `img/auction2.jpg`

  return (
    <Row>
      <Col span={12} offset={6}>
        <Row>
          <Card className="custom-card" cover={<img src={image} />}>

          </Card>
        </Row>
        <Row>
          <h2>Title</h2>
        </Row>
        <Row>
          <label>Created By</label>
          <h2>Title</h2>
        </Row>
        <Row>
          <label>Creator Royalties</label>
          <h2>Title</h2>
        </Row>
        <Row>
          <label>About the Creation</label>
          <h2>Title</h2>
        </Row>
      </Col>
    </Row>
  );
};
