import { ParsedAccount, TokenAccount, useUserAccounts } from '@oyster/common';
import React from 'react';
import { ArtCard } from '../../components/ArtCard';
import { useMeta } from '../../contexts';
import { Row, Col } from 'antd';
import Masonry from 'react-masonry-css'
import { Link } from 'react-router-dom';

export const ArtworksView = () => {
  const { metadata } = useMeta();
  const { userAccounts } = useUserAccounts();
  const accountByMint = userAccounts.reduce((prev, acc) => {
    prev.set(acc.info.mint.toBase58(), acc);
    return prev;
  }, new Map<string, TokenAccount>());

  const ownedMetadata = metadata.filter(m => accountByMint.has(m.info.mint.toBase58()));
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
    <div className="flexColumn" style={{ flex: 1 }}>
      <Col>
        <Row style={{ marginBottom: 30, marginTop: 20, fontSize: 20, fontWeight: 600 }}>Owned</Row>
        <Row>
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {ownedMetadata.map(m => {
              const id = m.pubkey.toBase58();
              return <Link to={`/art/${id}`}>
                <ArtCard key={id}
                  image={m.info.extended?.image}
                  category={m.info.extended?.category}
                  name={m.info?.name}
                  symbol={m.info.symbol}
                  preview={false} />
                </Link>
            })}
          </Masonry>
        </Row>
      </Col>
    </div>
  );
};
