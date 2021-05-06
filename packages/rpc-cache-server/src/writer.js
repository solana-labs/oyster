const { JSONRPCClient } = require("json-rpc-2.0");
const express = require("express");
const bodyParser = require("body-parser");
const redis = require("redis");

redisClient = redis.createClient();
const app = express();
app.use(bodyParser.json());

app.post("/", (req, res) => {
    // when this is called, it means a cache miss happened and the cache needs to be written to.
    // to do this, make an RPC call to the full node and write the value to cache.
    const client = new JSONRPCClient((jsonRPCRequest) =>
        axios({
            method: "post",
            url: "http://127.0.0.1:8899", // localnet url
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

    client.request("getProgramAccounts", {wormholdID: req.body.wormholeID})
        .then((result) => redis.set(req.body.wormholeID, result));
    // also going to want some cache eviction logic
});

app.listen(3001);
