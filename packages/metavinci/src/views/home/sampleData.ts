import { Auction, Artist } from "../../types"

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
    auctionerName: "Hello World",
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
