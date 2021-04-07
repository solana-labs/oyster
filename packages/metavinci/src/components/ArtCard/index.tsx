import React, { useLayoutEffect, useState } from 'react';
import { Card, Image } from 'antd';
import { MetadataCategory } from '@oyster/common';
import { ArtContent } from './../ArtContent';

const { Meta } = Card;

export const ArtCard = ({
  image,
  category,
  name,
  symbol,
  preview,
}: {
  image?: string;
  category?: MetadataCategory
  name?: String;
  symbol?: String;
  preview?: boolean;
}) => {
  return (
    <Card className="custom-card" cover={<ArtContent category={category} content={image} />}>
      <Meta title={`Title: ${name}`} description={`Symbol: ${symbol}`} />
    </Card>
  );
};
