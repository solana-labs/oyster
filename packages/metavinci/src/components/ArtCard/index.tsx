import React, { useLayoutEffect, useState } from 'react';
import { Card, Avatar, CardProps, Button } from 'antd';
import { MetadataCategory } from '@oyster/common';
import { ArtContent } from './../ArtContent';
import './index.less';
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
}

export const ArtCard = (props: ArtCardProps) => {
  let { className, small, category, image, name, preview, artist, description, close, pubkey, ...rest } = props;
  const art = useArt(pubkey);

  category = art?.category || category;
  image = art?.image || image;
  name = art?.title || name || '';
  artist = art?.artist || artist;
  description = art?.about || description;

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
        description={<span>
          <Avatar src="img/artist1.jpeg" /> {artist}
        </span>}
      />
    </Card>
  );
};
