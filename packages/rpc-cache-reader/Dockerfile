# syntax=docker/dockerfile:1
FROM node:15
RUN apk add --no-cache python g++ make
WORKDIR /rpc-cache-reader
COPY . .
RUN yarn install --production
CMD ["node", "src/reader.js"]