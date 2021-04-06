import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Card, Row, Col } from 'antd'

import { Art } from '../../types'

import './index.less'
import { getCountdown } from '../../utils/utils'


export const ItemCard = ({ art }: { art: Art }) => {
  const [minutes, setMinutes] = useState<number>(59)
  const [seconds, setSeconds] = useState<number>(59)

  const history = useHistory()

  useEffect(() => {
    if (art.endingTS) {
      const interval = setInterval(() => {
        const {minutes, seconds} = getCountdown(art.endingTS as number)
  
        setMinutes(minutes)
        setSeconds(seconds)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [])

  const handleCoverClick = async () => {
    history.push(art.link)
  }

  return (
    <Card
      hoverable
      style={{ width: 312, textAlign: 'left', borderRadius: '8px', overflow: 'hidden' }}
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
              <div>{minutes}m {seconds}s</div>
            </>}
          </Col>
        </Row>
      </div>
    </Card>
  )
}
