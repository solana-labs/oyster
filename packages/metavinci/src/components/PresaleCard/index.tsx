import React, { useEffect, useState } from 'react'
// import { useHistory } from 'react-router-dom'
import { Row, Col, Divider, Button } from 'antd'

import { Presale } from '../../types'

import './index.less'
import { getCountdown } from '../../utils/utils'
import { solanaToUSD } from '../../utils/assets'

const Price = ({amt}: {amt: number}) => {
  const [USDamt, setUSDamt] = useState<number>(0)

  useEffect(() => {
    solanaToUSD(amt).then(setUSDamt)
  }, [amt])

  return (
    <div>
      <span className="cd-number">◎{amt}</span>&nbsp;&nbsp;
      <span className="cd-label">${USDamt.toFixed(2)}</span>
    </div>
  )
}

export const PreSaleCard = ({ presale }: { presale: Presale }) => {
  const [hours, setHours] = useState<number>(23)
  const [minutes, setMinutes] = useState<number>(59)
  const [seconds, setSeconds] = useState<number>(59)

  useEffect(() => {
    const interval = setInterval(() => {
      const { hours, minutes, seconds } = getCountdown(presale.endingTS)

      setHours(hours)
      setMinutes(minutes)
      setSeconds(seconds)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="presale-card-container">
      <div style={{ fontWeight: 700, fontSize: '1.6rem' }}>Pre-Sale</div>
      <br />
      <div className="info-content" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.2rem' }}>
        The pre-sale will end when either the target price per share is met or the countdown ends.
      </div>
      <br />
      <div className="info-header">PRE-SALE ENDS IN</div>
      <Row style={{ width: 300 }}>
        <Col span={8}>
          <div className="cd-number">{hours}</div>
          <div className="cd-label">hours</div>
        </Col>
        <Col span={8}>
          <div className="cd-number">{minutes}</div>
          <div className="cd-label">minutes</div>
        </Col>
        <Col span={8}>
          <div className="cd-number">{seconds}</div>
          <div className="cd-label">seconds</div>
        </Col>
      </Row>
      <br />
      <div className="info-header">TARGET PRICE PER SHARE (NVA)</div>
      <div><Price amt={presale.targetPricePerShare as number}/></div>
      <Divider />
      <div className="info-header">PRICE PER SHARE (NVA)</div>
      <div><Price amt={presale.pricePerShare as number}/></div>
      <br />
      <div className="info-header">MARKET CAP</div>
      <div><Price amt={presale.marketCap as number}/></div>
      {/* <Row>
        <Col span={12}><Button className="primary-button">BUY SHARES</Button></Col>
        <Col span={12}><Button className="gradients-metal">SELL SHARES</Button></Col>
      </Row> */}
    </div>
  )
}
