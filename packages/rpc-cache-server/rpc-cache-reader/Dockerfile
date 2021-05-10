# syntax=docker/dockerfile:1
FROM node:15-buster
RUN apt install python g++ make
WORKDIR /rpc-cache-reader
COPY . .
RUN npm install
CMD ["node", "src/reader.js"]