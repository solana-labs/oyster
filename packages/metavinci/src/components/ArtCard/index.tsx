import React, { useEffect, useState } from 'react';
import { Card, Avatar, CardProps, Button } from 'antd';
import { MetadataCategory } from '@oyster/common';
import { ArtContent } from './../ArtContent';
import './index.less';
import { getCountdown } from '../../utils/utils';

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
  close?: () => void;
  endAuctionAt?: number;
}

export const ArtCard = (props: ArtCardProps) => {
  const { className, small, category, image, name, preview, artist, close, endAuctionAt, ...rest } = props;
  const [hours, setHours] = useState<number>(23)
  const [minutes, setMinutes] = useState<number>(59)
  const [seconds, setSeconds] = useState<number>(59)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!endAuctionAt) return
      const { hours, minutes, seconds } = getCountdown(endAuctionAt)

      setHours(hours)
      setMinutes(minutes)
      setSeconds(seconds)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card
      hoverable={true}
      className={`art-card ${small ? 'small' : ''} ${className}`}
      cover={<>
          {close && <Button className="card-close-button" shape="circle" onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            close();
          }} >X</Button>}
          <ArtContent category={category} content={image} preview={preview} />
        </>}
      {...rest}
    >
      <Meta
        title={`${name}`}
        description={<div>
          <Avatar src="img/artist1.jpeg" /> {artist}
          <div className="cd-container">
            <div className="cd-title">Ending in</div>
            <div className="cd-time">{hours}h {minutes}m {seconds}s</div>
          </div>
        </div>}
      />
    </Card>
  );
};
