import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Col, Row } from 'antd'

import './index.less'

interface IPreSaleBanner {
  artistName: string,
  productName: string,
  preSaleTS: number,
  image: string,
}

export const PreSaleBanner = ({ artistName, productName, preSaleTS, image }: IPreSaleBanner) => {
  const [days, setDays] = useState<number>(99)
  const [hours, setHours] = useState<number>(23)
  const [minutes, setMinutes] = useState<number>(59)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = (new Date()).getTime()
      let delta = Math.abs(preSaleTS - now) / 1000

      const days = Math.floor(delta / 86400)
      delta -= days * 86400

      const hours = Math.floor(delta / 3600) % 24
      delta -= hours * 3600

      const minutes = Math.floor(delta / 60) % 60
      delta -= minutes * 60

      setDays(days)
      setHours(hours)
      setMinutes(minutes)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ backgroundImage: `url(${image})` }} className="presale-container">
      <Row style={{ height: 200 }}>
        <Col span={12} style={{ display: 'flex' }}>
          <div style={{ margin: 'auto' }}>
            <div className="presale-title">{artistName}</div>
            <div className="presale-product">{productName}</div>
            <div style={{ fontSize: '0.7rem' }}>COUNTDOWN TO PRE-SALE</div>
            <Row style={{ maxWidth: 250, margin: 'auto' }}>
              <Col span={8}>
                <div className="cd-number">{days}</div>
                <div>days</div>
              </Col>
              <Col span={8}>
                <div className="cd-number">{hours}</div>
                <div>hours</div>
              </Col>
              <Col span={8}>
                <div className="cd-number">{minutes}</div>
                <div>minutes</div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </div>
  )
}
