import React, { useEffect, useState } from 'react';
import { Card, Avatar, CardProps, Button } from 'antd';
import { MetadataCategory } from '@oyster/common';
import { ArtContent } from './../ArtContent';
import './index.less';
import { getCountdown } from '../../utils/utils';
import { useArt } from '../../hooks';
import { PublicKey } from '@solana/web3.js';

const { Meta } = Card;

export interface ArtCardProps extends CardProps {
  pubkey?: PublicKey;
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
  let { className, small, category, image, name, preview, artist, description, close, pubkey, endAuctionAt, ...rest } = props;
  const art = useArt(pubkey);
  category = art?.category || category;
  image = art?.image || image;
  name = art?.title || name || '';
  artist = art?.artist || artist;
  description = art?.about || description;

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
            close && close();
          }} >X</Button>}
          <ArtContent category={category} content={image} preview={preview} />
        </>}
      {...rest}
    >
      <Meta
        title={`${name}`}
        description={<div>
          <Avatar src="img/artist1.jpeg" /> {artist}
          {endAuctionAt &&
            <div className="cd-container">
              {(hours == 0 && minutes == 0 && seconds == 0) ?
                <div className="cd-title">Finished</div>
                : <>
                <div className="cd-title">Ending in</div>
                <div className="cd-time">{hours}h {minutes}m {seconds}s</div>
              </>}
            </div>
          }
        </div>}
      />
    </Card>
  );
};
