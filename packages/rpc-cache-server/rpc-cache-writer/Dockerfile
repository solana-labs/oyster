# syntax=docker/dockerfile:1
FROM node:15-buster
RUN apt install python g++ make
WORKDIR /rpc-cache-writer
COPY . .
RUN yarn
CMD ["node", "src/writer.js"]
