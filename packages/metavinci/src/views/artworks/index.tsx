import React from 'react';
import { ArtCard } from '../../components/ArtCard';
import { Row, Col } from 'antd';
import Masonry from 'react-masonry-css';
import { Link } from 'react-router-dom';
import { useUserArts } from '../../hooks';

export const ArtworksView = () => {
  const ownedMetadata = useUserArts();
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  return (
    <div className="flexColumn" style={{ flex: 1 }}>
      <Col>
        <Row
          style={{
            marginBottom: 30,
            marginTop: 20,
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          Owned
        </Row>
        <Row>
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {ownedMetadata.map(m => {
              const id = m.metadata.pubkey.toBase58();
              return (
                <Link to={`/art/${id}`}>
                  <ArtCard
                    key={id}
                    image={m.metadata.info.extended?.image}
                    category={m.metadata.info.extended?.category}
                    name={m.metadata.info?.name}
                    symbol={m.metadata.info.symbol}
                    preview={false}
                  />
                </Link>
              );
            })}
          </Masonry>
        </Row>
      </Col>
    </div>
  );
};
