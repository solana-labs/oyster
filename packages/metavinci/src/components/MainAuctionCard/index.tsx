import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd'

import { Auction } from '../../types/index'

import './index.less'

export const MainAuctionCard = ({ auction }: { auction: Auction }) => {
  return <div style={{ backgroundImage: `url(${auction.image})` }} className="main-auction-container">
    <div className="main-auction-inner">
      <div className="main-auction-title">{auction.name}</div>
      <div className="main-auction-auctioner">by <a href={auction.auctionerLink}>{auction.auctionerName}</a></div>
      <div className="main-auction-bid">Highest Bid: ${auction.highestBid} / ◎{auction.solAmt}</div>
      <Button className="main-auction-details">
        <Link to={auction.link}>View details</Link>
      </Button>
    </div>
  </div>
}
