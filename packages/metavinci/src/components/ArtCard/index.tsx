import React, { useLayoutEffect, useState } from 'react';
import { Card, Avatar } from 'antd';
import { MetadataCategory } from '@oyster/common';
import { ArtContent } from './../ArtContent';
import './index.less';

const { Meta } = Card;

export const ArtCard = ({
  image,
  category,
  name,
  symbol,
  description,
  artist,
  preview,
}: {
  image?: string;
  category?: MetadataCategory
  name?: string;
  symbol?: string;
  description?: string;
  artist?: string;
  preview?: boolean;
}) => {
  return (
    <Card
      hoverable={true}
      className="art-card"
      cover={<ArtContent category={category} content={image} />}
    >
      <Meta
        title={`${name}`}
        description={<span>
          <Avatar src="img/artist1.jpeg" /> {artist}
        </span>}
      />
    </Card>
  );
};
