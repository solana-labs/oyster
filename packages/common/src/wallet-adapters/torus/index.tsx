import EventEmitter from "eventemitter3"
import solanaWeb3 from "@solana/web3.js"
import { Account, PublicKey, Transaction, Connection } from "@solana/web3.js"
import { WalletAdapter } from "@solana/wallet-base"
import Torus from "@toruslabs/torus-embed"
import OpenLogin from "@toruslabs/openlogin"
import { getED25519Key } from "@toruslabs/openlogin-ed25519"
import { notify } from "../../utils/notifications"
import { ENDPOINTS } from "../../contexts"
// import { useConnection } from "../../contexts"

type TorusEvent = "disconnect" | "connect";
type TorusRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions";

// interface TorusProvider {
//   publicKey?: PublicKey;
//   isConnected?: boolean;
//   autoApprove?: boolean;
//   signTransaction: (transaction: Transaction) => Promise<Transaction>;
//   signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
//   connect: () => Promise<void>;
//   disconnect: () => Promise<void>;
//   on: (event: TorusEvent, handler: (args: any) => void) => void;
//   request: (method: TorusRequestMethod, params: any) => Promise<any>;
// }

const getSolanaPrivateKey = (openloginKey: string)=>{
  const  { sk } = getED25519Key(openloginKey)
  return sk
}

export class TorusWalletAdapter extends EventEmitter implements WalletAdapter {
  _provider: Torus | undefined;
  // _provider: OpenLogin | undefined;
  _publicKey: PublicKey | null;

  constructor(providerUrl: string, endpoint: string) {
    super()
    this._publicKey = null
    this.connect = this.connect.bind(this)
    console.log("Constructing...", {providerUrl, endpoint})
  }

  // get connected() {
  //   return this._provider?.isConnected || false;
  // }

  // get autoApprove() {
  //   return this._provider?.autoApprove || false;
  // }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    return transactions
  }

  get publicKey() {
    return this._publicKey;
  }

  async signTransaction(transaction: Transaction) {
    return transaction
  }

  connect = async () => {
    console.log("Connecting...")
    // const connection = useConnection()
    const solanaNetwork = ENDPOINTS.find(end => end.name === "testnet")
    if (!solanaNetwork) return

    const connection = new Connection(solanaNetwork.endpoint)

    // this._provider = new OpenLogin({
    //   clientId: "BFvMIZJz9gVTzTXzJg_WezLkhUib-U2Q1wgDR1x95UzU5i-s642W8yxUvBXs4Sj1JuhRohgxvZL2nYnCA1_ZDbE",
    //   network: "testnet", // mainnet, testnet, development
    // })
    // await this._provider.init()
    // console.log({openlogin: this._provider})

    // if (this._provider.privKey) { // already logged in
    //   const privateKey = this._provider.privKey
    //   const secretKey = getSolanaPrivateKey(privateKey)
    //   console.log("secretKey", secretKey)
    //   const account = new Account(secretKey)
    //   const accountInfo = await connection.getAccountInfo(account.publicKey)
    //   console.log("accountInfo", accountInfo)
    // } else {
    //   const privKey = await this._provider.login()
    //   console.log("privKey", privKey)
    //   const solanaPrivateKey = getSolanaPrivateKey(privKey.privKey);
    //   console.log("solanaPrivateKey", solanaPrivateKey)
    //   // await getAccountInfo(solanaNetwork.url,solanaPrivateKey)
    // }

    this._provider = new Torus({})
    await this._provider.init({})
    await this._provider.login({})
    // const sWeb3 = new solanaWeb3(torus.provider)
    console.log({torus: this._provider})
    console.log({solanaWeb3})
    // result=eyJwcml2S2V5IjoiMmE3ZDUxOTBiYzA4MmUxMzYyZDE5NjVkNzI3OWQ1OWE0ZDY5ZDJlZWUzZGVmYzBiNThmMTk4OGE4YTY1YTA1YSIsInN0b3JlIjp7InRvdWNoSURQcmVmZXJlbmNlIjoidW5zZXQiLCJhcHBTdGF0ZSI6IiJ9fQ==
    
    const userInfo = await this._provider.getUserInfo("Holi")
    console.log({userInfo})

    // const publicAddress = await this._provider.getPublicAddress({
    //   verifier: "google",
    //   verifierId: "random@gmail.com",
    // })

    // const sdkInstance = new OpenLogin({
    //   clientId: "YOUR_PROJECT_ID",
    //   network: "testnet"
    // });
    // async function initializeOpenlogin() {
    //   await sdkInstance.init();
    //   if (sdkInstance.privKey) {
    //     // qpp has access ot private key now
    //     ...
    //     ...
    //   }
    //   setSdk(sdkInstance);
    //   setLoading(false)
    // }
    // initializeOpenlogin()
    // if (this._provider) {
    //   return;
    // }

    // let provider: TorusProvider;
    // if ((window as any)?.solana?.isTorus) {
    //   provider = (window as any).solana;
    // } else {
    //   window.open("https://Torus.app/", "_blank");
    //   notify({
    //     message: "Torus Error",
    //     description: "Please install Torus wallet from Chrome ",
    //   });
    //   return;
    // }

    // provider.on('connect', () => {
    //   this._provider = provider;
    //   this.emit("connect");
    // })

    // if (!provider.isConnected) {
    //   await provider.connect();
    // }

    // this._provider = provider;
    this.emit("connect");
  }

  disconnect = async () => {
    console.log("Disconecting...")
    if (this._provider) {
      // await this._provider.cleanUp()
      await this._provider.logout()
      this._provider = undefined;
      this.emit("disconnect");
    }
  }
}
