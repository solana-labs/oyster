import React, { useLayoutEffect, useState } from 'react';
import { Card, Image } from 'antd';

const { Meta } = Card;

export const ArtCard = ({
  image,
  name,
  symbol,
  preview,
}: {
  image?: string;
  name?: String;
  symbol?: String;
  preview?: boolean;
}) => {
  return (
    <Card className="custom-card" cover={<Image preview={preview} src={image} />}>
      <Meta title={`Title: ${name}`} description={`Symbol: ${symbol}`} />
    </Card>
  );
};
