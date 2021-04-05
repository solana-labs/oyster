import { Auction, Artist, Art } from "../../types"

export const sampleAuction: Auction = {
  name: "Liquidity Pool",
  auctionerName: "Rama XI",
  auctionerLink: "/address/4321dcba",
  highestBid: 23000,
  solAmt: 200,
  link: "/auction/1234abcd",
  image: "http://localhost:3000/img/auction1.jpg",
}

export const sampleAuctions: Array<Auction> = [
  {
    name: "Team Trees",
    auctionerName: "NFToros",
    auctionerLink: "/address/4321dcba",
    highestBid: 23000,
    solAmt: 115,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction2.jpg",
  },
  {
    name: "Miko 4",
    auctionerName: "Hello World Hello World Hello World Hello World Hello World Hello World Hello World Hello World ",
    auctionerLink: "/address/4321dcba",
    highestBid: 13000,
    solAmt: 75,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction3.jpg",
  },
  {
    name: "Tell Me",
    auctionerName: "Supper Club",
    auctionerLink: "/address/4321dcba",
    highestBid: 24000,
    solAmt: 120,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction4.jpg",
  },
  {
    name: "Saucy",
    auctionerName: "Mr. Momo",
    auctionerLink: "/address/4321dcba",
    highestBid: 23000,
    solAmt: 200,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction5.jpg",
  },
  {
    name: "Haze",
    auctionerName: "Daily Dose",
    auctionerLink: "/address/4321dcba",
    highestBid: 23000,
    solAmt: 200,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction6.jpg",
  },
  {
    name: "Wounderground",
    auctionerName: "The Maze",
    auctionerLink: "/address/4321dcba",
    highestBid: 23000,
    solAmt: 200,
    link: "/auction/1234abcd",
    image: "http://localhost:3000/img/auction7.jpg",
  },
]

export const sampleArtists: Array<Artist> = [
  {
    name: "Yuzu415",
    link: "/artist/1234abcd",
    image: "http://localhost:3000/img/artist1.jpeg",
    itemsAvailable: 7,
    itemsSold: 215,
  },
  {
    name: "Mischa",
    link: "/artist/1234abcd",
    image: "http://localhost:3000/img/artist2.jpeg",
    itemsAvailable: 2,
    itemsSold: 215,
  },
  {
    name: "Sammy",
    link: "/artist/1234abcd",
    image: "http://localhost:3000/img/artist3.jpeg",
    itemsAvailable: 7,
    itemsSold: 215,
  },
  {
    name: "Wonderful",
    link: "/artist/1234abcd",
    image: "http://localhost:3000/img/artist4.jpeg",
    itemsAvailable: 7,
    itemsSold: 215,
  },
]

export const sampleArts: Array<Art> = [
  {
    image: "http://localhost:3000/img/auction1.jpg",
    link: "/art/1234abcd",
    title: "Cryptokitty #4823923",
    artist: "cryptokitties",
    priceSOL: 1.1,
    priceUSD: 24,
    endingTS: 1617843346000,
  },
  {
    image: "http://localhost:3000/img/auction2.jpg",
    link: "/art/1234abcd",
    title: "Here Comes Trouble",
    artist: "@artworkwizard",
    priceSOL: 1.1,
    priceUSD: 24,
    endingTS: 1617843346000,
  },
  {
    image: "http://localhost:3000/img/auction3.jpg",
    link: "/art/1234abcd",
    title: "“ALL-DEAD” CHUCK 70s",
    artist: "NFTSNEAKERS",
    priceSOL: 1.1,
    priceUSD: 24,
    endingTS: 1617843346000,
  },
  {
    image: "http://localhost:3000/img/auction4.jpg",
    link: "/art/1234abcd",
    title: "ONE #1/1",
    artist: "RAC",
    priceSOL: 1.1,
    priceUSD: 24,
    endingTS: 1617843346000,
  },
]
