import React, { useLayoutEffect, useState } from 'react';
import { Card, Avatar, CardProps } from 'antd';
import { MetadataCategory } from '@oyster/common';
import { ArtContent } from './../ArtContent';
import './index.less';

const { Meta } = Card;

export interface ArtCardProps extends CardProps {
  image?: string;
  category?: MetadataCategory
  name?: string;
  symbol?: string;
  description?: string;
  artist?: string;
  preview?: boolean;
  small?: boolean;
}

export const ArtCard = (props: ArtCardProps) => {
  const { className, small, category, image, name, preview, artist, ...rest } = props;
  return (
    <Card
      hoverable={true}
      className={`art-card ${small ? 'small' : ''} ${className}`}
      cover={<ArtContent category={category} content={image} preview={preview} />}
      {...rest}
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
