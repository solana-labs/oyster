import React, { useContext, useEffect, useState } from 'react'
import OpenLogin from "@toruslabs/openlogin"
import { getED25519Key } from "@toruslabs/openlogin-ed25519"
// import { EventEmitter, programIds, useConnection, decodeMetadata, Metadata, getMultipleAccounts, cache, MintParser, ParsedAccount } from '@oyster/common';
import { useConnection } from '@oyster/common'
import { Account } from "@solana/web3.js"
// import { MintInfo } from '@solana/spl-token';
// import { Connection, PublicKey, PublicKeyAndAccount } from '@solana/web3.js'
// import BN from 'bn.js';
import bs58 from 'bs58'

type IOpenLogin = any

interface TorusContextState {
  openLogin: IOpenLogin,
}

const TorusContext = React.createContext<TorusContextState>({
  openLogin: null
});

export function TorusProvider({ children = null as any }) {
  const connection = useConnection();
  const [openLogin, setOpenLogin] = useState<IOpenLogin | null>(null)

  const getSolanaPrivateKey = (openloginKey: string)=>{
    const  { sk } = getED25519Key(openloginKey)
    return sk
  }

  const getAccountInfo = async(secretKey: Buffer) => {
    const account = new Account(secretKey);
    const accountInfo = await connection.getAccountInfo(account.publicKey);
    // setPrivateKey(bs58.encode(account.secretKey));
    // setUserAccount(account);
    // setUserAccountInfo(accountInfo);
    return accountInfo;
  }

  useEffect(() => {
    const initializeOpenlogin = async () => {
      const sdkInstance = new OpenLogin({
        clientId: "BFvMIZJz9gVTzTXzJg_WezLkhUib-U2Q1wgDR1x95UzU5i-s642W8yxUvBXs4Sj1JuhRohgxvZL2nYnCA1_ZDbE",
        network: "testnet",
        // originData: {
        //   "https://solana-openlogin.herokuapp.com": process.env.REACT_APP_SIG
        // }
      })
      await sdkInstance.init()
      if (sdkInstance.privKey) { // Already logged in
        debugger
        const privateKey = sdkInstance.privKey
        const secretKey = getSolanaPrivateKey(privateKey)
        await getAccountInfo(secretKey)
      } else {
        const {privKey} = await sdkInstance.login()
        debugger
        const solanaPrivateKey = getSolanaPrivateKey(privKey);
        await getAccountInfo(solanaPrivateKey);
      }
      setOpenLogin(sdkInstance)
    }
    initializeOpenlogin();
  }, [setOpenLogin])

  return (
    <TorusContext.Provider value={{ openLogin }}>
      {children}
    </TorusContext.Provider>
  );
}


export const useTorus = () => {
  const context = useContext(TorusContext)
  return context as TorusContextState
}
