import React from 'react'
import { useHistory } from 'react-router-dom'
import { Card, Row, Col } from 'antd'

import { Art } from '../../types'

import './index.less'


export const ItemCard = ({ art }: { art: Art }) => {
  const history = useHistory()

  const handleCoverClick = async () => {
    history.push(art.link)
  }

  return (
    <Card
      hoverable
      style={{ width: 210, textAlign: 'left', borderRadius: '10%' }}
      cover={<img alt={art.title} src={art.image} onClick={handleCoverClick} />}
    >
      <div style={{backgroundColor: '#282828', padding: '1vw'}}>
        <div className="art-title">{art.title}</div>
        <div>@{art.artist}</div>
      </div>
      <div className="inner-2">
        <Row>
          <Col span={12}>
            <div>Current price</div>
            <div>◎{art.priceSOL} {art.priceUSD && `($${art.priceUSD})`}</div>
          </Col>
          <Col span={12}>
            {art.endingTS && <>
              <div>Ending in</div>
              <div>53m 4s</div>
            </>}
          </Col>
        </Row>
      </div>
    </Card>
  )
}
