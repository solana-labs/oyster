import React, { useEffect, useState } from 'react';
import { Card, Avatar, CardProps, Button, Badge } from 'antd';
import { MetadataCategory } from '@oyster/common';
import { ArtContent } from './../ArtContent';
import './index.less';
import { getCountdown } from '../../utils/utils';
import { useArt } from '../../hooks';
import { PublicKey } from '@solana/web3.js';
import { ArtType } from '../../types';
import { EditionType } from '../../models/metaplex';

const { Meta } = Card;

export interface ArtCardProps extends CardProps {
  pubkey?: PublicKey;
  image?: string;
  category?: MetadataCategory;
  name?: string;
  symbol?: string;
  description?: string;
  artist?: string;
  preview?: boolean;
  small?: boolean;
  close?: () => void;
  editionType?: EditionType;
  endAuctionAt?: number;
}

export const ArtCard = (props: ArtCardProps) => {
  let {
    className,
    small,
    category,
    image,
    name,
    preview,
    artist,
    description,
    close,
    pubkey,
    endAuctionAt,
    editionType,
    ...rest
  } = props;
  const art = useArt(pubkey);
  category = art?.category || category;
  image = art?.image || image;
  name = art?.title || name || '';
  artist = art?.artist || artist;
  description = art?.about || description;

  const [hours, setHours] = useState<number>(23);
  const [minutes, setMinutes] = useState<number>(59);
  const [seconds, setSeconds] = useState<number>(59);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!endAuctionAt) return;
      const { hours, minutes, seconds } = getCountdown(endAuctionAt);

      setHours(hours);
      setMinutes(minutes);
      setSeconds(seconds);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const card = (
    <Card
      hoverable={true}
      className={`art-card ${small ? 'small' : ''} ${className}`}
      cover={
        <>
          {close && (
            <Button
              className="card-close-button"
              shape="circle"
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                close && close();
              }}
            >
              X
            </Button>
          )}
          <ArtContent category={category} content={image} preview={preview} />
        </>
      }
      {...rest}
    >
      <Meta
        title={`${name}`}
        description={
          <div>
            <Avatar src="img/artist1.jpeg" /> {artist}
            {art.type == ArtType.LimitedMasterEdition && (
              <>
                <br />
                {!endAuctionAt && (
                  <span style={{ padding: '24px' }}>
                    {(art.maxSupply || 0) - (art.supply || 0)}/
                    {art.maxSupply || 0} prints remaining
                  </span>
                )}
              </>
            )}
            {endAuctionAt && (
              <div className="cd-container">
                {hours == 0 && minutes == 0 && seconds == 0 ? (
                  <div className="cd-title">Finished</div>
                ) : (
                  <>
                    <div className="cd-title">Ending in</div>
                    <div className="cd-time">
                      {hours}h {minutes}m {seconds}s
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        }
      />
    </Card>
  );

  if (art.type == ArtType.NFT) {
    return <div className="normal-record">{card}</div>;
  } else if (art.type == ArtType.LimitedEditionPrint) {
    return (
      <div className="normal-record">
        <Badge.Ribbon text={`Edition #${art.edition}`}>{card}</Badge.Ribbon>
      </div>
    );
  } else if (art.type == ArtType.OpenEditionPrint) {
    return (
      <div className="normal-record">
        <Badge.Ribbon text={`Open Edition`}>{card}</Badge.Ribbon>
      </div>
    );
  } else if (art.type == ArtType.LimitedMasterEdition) {
    return (
      <div
        className={
          editionType == EditionType.LimitedEdition
            ? 'normal-record'
            : 'limited-master-record'
        }
      >
        <Badge.Ribbon
          text={`Limited Edition ${
            editionType == EditionType.LimitedEdition
              ? 'Printing'
              : 'Master Record'
          }`}
        >
          {card}
        </Badge.Ribbon>
      </div>
    );
  } else if (art.type == ArtType.OpenMasterEdition) {
    return (
      <div
        className={
          editionType == EditionType.OpenEdition
            ? 'normal-record'
            : 'open-master-record'
        }
      >
        <Badge.Ribbon
          text={`Open Edition ${
            editionType == EditionType.OpenEdition
              ? 'Printing'
              : 'Master Record'
          }`}
        >
          {card}
        </Badge.Ribbon>
      </div>
    );
  } else return card;
};
