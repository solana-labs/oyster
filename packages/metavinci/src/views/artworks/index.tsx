import React, { useState } from 'react';
import { ArtCard } from '../../components/ArtCard';
import { Layout, Row, Col, Tabs } from 'antd';
import Masonry from 'react-masonry-css';
import { Link } from 'react-router-dom';
import { useUserArts } from '../../hooks';
import { useMeta } from '../../contexts';

const { TabPane } = Tabs;

const { Content } = Layout;


export enum ArtworkViewState {
  Metaplex = '0',
  Owned = '1',
  Created = '2',
}

export const ArtworksView = () => {
  const ownedMetadata = useUserArts();
  const { metadata } = useMeta();
  const [activeKey, setActiveKey] = useState(ArtworkViewState.Metaplex);
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  const items = activeKey === ArtworkViewState.Metaplex ? metadata : ownedMetadata.map(m => m.metadata);

  const artworkGrid = <Masonry
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
      {items.map(m => {
        const id = m.pubkey.toBase58();
        return (
          <Link to={`/art/${id}`}>
            <ArtCard
              key={id}
              pubkey={m.pubkey}
              preview={false}
            />
          </Link>
        );
      })}
    </Masonry>;

  return (
    <Layout style={{ margin: 0, marginTop: 30 }}>
      <Content style={{ display: 'flex', flexWrap: 'wrap' }}>
        <Col style={{ width: '100%', marginTop: 10 }}>
          <Row>
            <Tabs
              activeKey={activeKey}
              onTabClick={key => setActiveKey(key as ArtworkViewState)}
            >
              <TabPane
                tab={<span className="tab-title">All</span>}
                key={ArtworkViewState.Metaplex}
              >
                {artworkGrid}
              </TabPane>
              <TabPane
                tab={<span className="tab-title">Created</span>}
                key={ArtworkViewState.Created}
              >
                {artworkGrid}
              </TabPane>
              <TabPane
                tab={<span className="tab-title">Owned</span>}
                key={ArtworkViewState.Owned}
              >
                {artworkGrid}
              </TabPane>
            </Tabs>
          </Row>
        </Col>
      </Content>
    </Layout>
  );
};
