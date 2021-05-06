const { JSONRPCServer } = require("json-rpc-2.0");
const express = require("express");
const bodyParser = require("body-parser");
const redis = require("redis");
const crypto = require("crypto");

const server = new JSONRPCServer();
const redisClient = redis.createClient();
const getProgramAccounts = function({ wormholeID })
{
    return new Promise((resolve, reject) => {
        redisClient.get(wormholeID, function(err, reply) {
            if (err) {
                reject(err);
            } else {
                if (reply === null) {
                    let uuid = crypto.randomUUID();
                    redisClient.set(wormholeID, uuid, redis.print);
                    resolve(uuid);
                    return;
                }
                resolve(reply);
            }
        });
    });
};
server.addMethod("getProgramAccounts", getProgramAccounts);

const app = express();
app.use(bodyParser.json());

app.post("/json-rpc", (req, res) => {
    const jsonRPCRequest = req.body;
    // server.receive takes a JSON-RPC request and returns a Promise of a JSON-RPC response.
    console.log("received request");
    console.log(jsonRPCRequest);
    server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
        if (jsonRPCResponse) {
            res.json(jsonRPCResponse);
        } else {
            console.log("no response");
            res.sendStatus(204);
        }
    });
});

app.listen(80);
