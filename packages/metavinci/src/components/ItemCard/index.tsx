import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Card, Row, Col } from 'antd'

import { Art } from '../../types'

import './index.less'


export const ItemCard = ({ art }: { art: Art }) => {
  const [minutes, setMinutes] = useState<number>(59)
  const [seconds, setSeconds] = useState<number>(59)

  const history = useHistory()

  useEffect(() => {
    if (art.endingTS) {
      const interval = setInterval(() => {
        const now = (new Date()).getTime()
        let delta = Math.abs(art.endingTS as number - now) / 1000
  
        const days = Math.floor(delta / 86400)
        delta -= days * 86400
  
        const hours = Math.floor(delta / 3600) % 24
        delta -= hours * 3600
  
        const minutes = Math.floor(delta / 60) % 60
        delta -= minutes * 60

        const seconds = Math.floor(delta % 60)
  
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
