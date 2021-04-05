import React from 'react'
import { useHistory } from 'react-router-dom'
import { Card } from 'antd'

import { Auction } from '../../types'

import './index.less'


export const AuctionCard = ({ auction, sold }: { auction: Auction, sold?: boolean }) => {
  const history = useHistory()

  const handleCoverClick = async () => {
    history.push(auction.link)
  }

  return (
    <Card
      hoverable
      style={{ width: 210, textAlign: 'left' }}
      cover={<img alt={auction.name} src={auction.image} onClick={handleCoverClick} />}
    >
      <div>{auction.name}</div>
      <a href={auction.auctionerLink}>{auction.auctionerName}</a>
      <div className="auction-bid">{sold ? 'SOLD' : 'Highest Bid:'} <span style={{color: '#13c2c2'}}>${auction.highestBid}</span> / ◎{auction.solAmt}</div>
    </Card>
  )
}
