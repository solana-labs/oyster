
export interface Auction {
  name: string,
  auctionerName: string,
  auctionerLink: string,
  highestBid: number,
  solAmt: number,
  link: string,
  image: string,
}

export interface Artist {
  name: string,
  link: string,
  image: string,
  itemsAvailable?: number,
  itemsSold?: number,
}

export interface Art {
  image: string,
  link: string,
  title: string,
  artist: string,
  priceSOL: number,
  priceUSD?: number,
  endingTS?: number,
}
