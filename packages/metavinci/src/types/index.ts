import { MetadataCategory } from '@oyster/common';

export interface Auction {
  name: string;
  auctionerName: string;
  auctionerLink: string;
  highestBid: number;
  solAmt: number;
  link: string;
  image: string;

  endingTS: number;
}

export interface Artist {
  name: string;
  link: string;
  image: string;
  itemsAvailable?: number;
  itemsSold?: number;
  about?: string;
}

export interface Art {
  image: string;
  category: MetadataCategory;
  link: string;
  title: string;
  artist: string;
  priceSOL: number;
  priceUSD?: number;
  endingTS?: number;
  royalties?: number;
  about?: string;
}

export interface Presale {
  endingTS: number;
  targetPricePerShare?: number;
  pricePerShare?: number;
  marketCap?: number;
}
