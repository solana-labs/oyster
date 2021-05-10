# syntax=docker/dockerfile:1
FROM node:15-buster
RUN apt install python g++ make
WORKDIR /rpc-cache-reader
COPY . .
RUN yarn
CMD ["node", "src/reader.js"]