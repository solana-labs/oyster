import React from 'react';
import { Row, Card } from 'antd';
import { useParams } from 'react-router-dom';
import { useArt } from './../../hooks';

export const ArtView = () => {
  const { id } = useParams<{ id: string }>();
  const art = useArt(id);

  const image = `/img/auction2.jpg`

  return (
    <>
      <Row>
        <Card className="custom-card" cover={<img src={image} />}>

        </Card>
      </Row>
    </>
  );
};
