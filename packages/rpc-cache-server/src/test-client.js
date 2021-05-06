const { JSONRPCClient } = require("json-rpc-2.0");
const axios = require("axios");

// JSONRPCClient needs to know how to send a JSON-RPC request.
// Tell it by passing a function to its constructor. The function must take a JSON-RPC request and send it.
const client = new JSONRPCClient((jsonRPCRequest) =>
  axios({
      method: "post",
      url: "http://localhost:3000/json-rpc",
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

client
    .request("getProgramAccounts", { wormholeID: "WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC" })
    .then((result) => console.log(result));

