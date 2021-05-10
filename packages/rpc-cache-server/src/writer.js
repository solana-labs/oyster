const express = require("express");
const bodyParser = require("body-parser");
const redis = require("redis");
const {Connection, PublicKey} = require("@solana/web3.js");
const settings = require("./config");

const redisClient = redis.createClient();
const app = express();
app.use(bodyParser.json());

const connection = new Connection("https://solana-api.projectserum.com/", 'recent')
const webSocketsIds = [];

const setRedisAccounts = (accounts, programId, setWebsockets = false) => {
  for (const acc of accounts) {
    const pubkey = acc.pubkey;
    if (setWebsockets) {

      console.log(`Creating Websocket for: onProgramAccountChange of ${programId}`)
      const subId = connection.onProgramAccountChange(
        new PublicKey(programId),
        async info => {
          const pubkey =
            typeof info.accountId === 'string'
              ? info.accountId
              : info.accountId.toBase58();
          redisClient.hset(programId, pubkey, JSON.stringify(info.accountInfo))
        },
      )
      webSocketsIds.push(subId)
    }
    console.log(`saving in cache ${pubkey} of ${programId}`)
    redisClient.hset(programId, pubkey, JSON.stringify(acc.account))
  }
}

(async () => {
  console.log(`Populating cache with methods: ${settings.cacheFunctions} for program ids: ${settings.programIDs}`)
  for (const func of settings.cacheFunctions) {
    for (const programID of settings.programIDs) {
      console.log(`Fetching: ${func} of ${programID}`)
      const resp = await connection._rpcRequest(
        func,
        [
          programID,
          {}
        ]);
      setRedisAccounts(resp.result, programID, true)
    }
  }
  console.log("Finished Populating cache")
})()


app.post("/", (req, res) => {
  // when this is called, it means a cache miss happened and the cache needs to be written to.
  // to do this, make an RPC call to the full node and write the value to cache.
  const {programId, filters} = req.body;
  console.log(`Cache invalidation: ${{programId,  filters}}`);
  (async () => {
    const resp = await connection.getProgramAccounts(programId, [
      programId,
      filters
    ]);
    setRedisAccounts(resp, programId, false)
  })()
  return res.sendStatus(200)
});

app.listen(3002);
