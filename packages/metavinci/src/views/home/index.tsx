import React from 'react'
import { Layout, Row, Col } from 'antd'
import Masonry from 'react-masonry-css'

import { Art } from '../../types'
import { PreSaleBanner } from '../../components/PreSaleBanner'
import { ItemCard } from '../../components/ItemCard'
import { sampleArts } from './sampleData'
import { useMeta } from '../../contexts/meta'

import './index.less'

const { Content } = Layout


export const HomeView = () => {
  // TODO: fetch real data
  const { accounts } = useMeta()
  const arts: Array<Art> = sampleArts

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  }

  return (
    <Layout style={{ margin: 0, marginTop: 30 }}>
      <PreSaleBanner
        artistName={"RAC"}
        productName={"THE BOY COLLECTION"}
        preSaleTS={1618690343000}
        image="img/banner1.jpeg"
      />
      <Layout>
        <Content style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Col>
            <Row style={{ marginBottom: 30, marginTop: 20, fontSize: 20, fontWeight: 600 }}>Featured</Row>

            <Row>
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="my-masonry-grid"
                columnClassName="my-masonry-grid_column"
              >
                {arts.map((art, idx) => (
                  <ItemCard key={idx} art={art}/>
                ))}
              </Masonry>
            </Row>

          </Col>
        </Content>
      </Layout>
    </Layout>
  );
};
