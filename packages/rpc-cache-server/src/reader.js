const {JSONRPCServer} = require("json-rpc-2.0");
const express = require("express");
const bodyParser = require("body-parser");
const redis = require("redis");
const cors = require("cors");
const axios = require("axios");
const settings = require("./config");

const {Connection} = require("@solana/web3.js");

const connection = new Connection("https://solana-api.projectserum.com/", 'recent')

const server = new JSONRPCServer();
const redisClient = redis.createClient();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const getProgramAccounts = function (params) {
  return new Promise((resolve, reject) => {
    const programID = params[0];
    const filters = params[1];
    redisClient.hvals(programID, function (err, reply) {
      if (err) {
        reject(err);
      } else {
        if (reply === null) { // if cache miss
          // What it needs to do:
          // 1. Notify the writer
          axios({
            method: "post",
            url: "http://localhost:3001/",
            data: {programID, filters}
          });
          reject(err)
        }
        let parsed = []
        for (const acc of reply) {
          try {
            parsed.push(JSON.parse(acc))
          } catch (e) {
            console.log(acc);
          }
        }
        resolve(parsed);
      }
    });
  });
};

server.addMethod("getProgramAccounts", getProgramAccounts);

app.post("/json-rpc", (req, res) => {
  const jsonRPCRequest = req.body;
  // server.receive takes a JSON-RPC request and returns a Promise of a JSON-RPC response.
  console.log("received request");
  console.log(jsonRPCRequest);
  if (settings.cacheFunctions.indexOf(jsonRPCRequest.method) >= 0) {
    server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
      if (jsonRPCResponse) {
        res.json(jsonRPCResponse);
      } else {
        console.log("no response");
        res.sendStatus(204);
      }
    });
  } else {
    connection._rpcRequest(
      jsonRPCRequest.method,
      jsonRPCRequest.params
    ).then((resp) => {
      res.json(resp);
    });
  }
});

app.listen(3001);
