const { JSONRPCServer } = require("json-rpc-2.0");
const express = require("express");
const bodyParser = require("body-parser");
const redis = require("redis");
const crypto = require("crypto");
const axios = require("axios");
const settings = require("./config");

const server = new JSONRPCServer();
const redisClient = redis.createClient();

const programIDs = settings.programIDs;

const getProgramAccounts = function({ programID })
{
    return new Promise((resolve, reject) => {
        redisClient.get(programID, function(err, reply) {
            if (err) {
                reject(err);
            } else {
                if (reply === null) { // if cache miss
                    // What it needs to do:
                    // 1. Notify the writer
                    axios({
                        method : "post",
                        url : "http://localhost:3001/",
                        data : {identifier : programID}
                    });

                    // 2. Send an RPC request to the full node on behalf of the client
                    const client = new JSONRPCClient((jsonRPCRequest) =>
                        axios({
                            method: "post",
                            url: "https://solana-api.projectserum.com/", // mainnet url
                            headers: {
                                "content-type": "application/json",
                            },
                            data: jsonRPCRequest,
                        }).then((response) => {
                            if (response.status === 200) {
                                // Use client.receive when you received a JSON-RPC response.
                                return client.receive(response.data);
                            } else if (jsonRPCRequest.id !== undefined) {
                                return Promise.reject(new Error(response.statusText));
                            }
                        })
                    );
                    var val = null;
                    client
                        .request("getProgramAccounts", { programID: programID })
                        .then((result) => val = result);
                    resolve(val);
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

app.listen(3001);
