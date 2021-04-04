import React from 'react'
import { useHistory } from 'react-router-dom'
import { Card } from 'antd'

import { Auction } from '../../types'

import './index.less'


export const AuctionCard = ({ auction }: { auction: Auction }) => {
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
      <div className="auction-bid">Highest Bid: ${auction.highestBid} / ◎{auction.solAmt}</div>
    </Card>
  )
}
