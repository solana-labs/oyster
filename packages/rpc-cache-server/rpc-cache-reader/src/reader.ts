import {JSONRPCParams, JSONRPCResponse, JSONRPCServer} from "json-rpc-2.0";
import express from "express";
import bodyParser from "body-parser";
import redis from "redis";
import cors from "cors";
import axios from "axios";
import {settings} from "./config";
import {Connection, KeyedAccountInfo} from "@solana/web3.js";

const connection = new Connection("https://solana-api.projectserum.com/", 'recent')

const server = new JSONRPCServer();
const redisClient = redis.createClient();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const getProgramAccounts =  (params: Partial<JSONRPCParams> | undefined) => {
  return new Promise((resolve, reject) => {
    if (params) {
      const programID = (params as any[])[0];
      const filters = (params as any[])[1];
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
          const parsed: Array<KeyedAccountInfo> = []
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
    } else {
      resolve([]);
    }
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
    (connection as any)._rpcRequest(
      jsonRPCRequest.method,
      jsonRPCRequest.params
    ).then((resp: JSONRPCResponse) => {
      res.json(resp);
    });
  }
});

app.listen(3001);
