import React, {createContext, FunctionComponent, useContext} from "react"
import {Connection} from "@solana/web3.js";
import {SolanaBridge} from "../core";
import { useConnection, useConnectionConfig } from "@oyster/common/dist/lib/contexts/connection";
import { utils } from '@oyster/common';

export const BridgeContext = createContext<SolanaBridge>(
  new SolanaBridge(
    "",
    new Connection(""),
    utils.programIds().wormhole.pubkey,
    utils.programIds().token));

export const BridgeProvider: FunctionComponent = ({children}) => {
  const { endpoint } = useConnectionConfig();
  const connection = useConnection();
  const programs = utils.programIds();

  let bridge = new SolanaBridge(endpoint, connection, programs.wormhole.pubkey, programs.token);
  return (
    <BridgeContext.Provider value={bridge}>
      {children}
    </BridgeContext.Provider>
  )
}

export const useBridge = () => {
  const bridge = useContext(BridgeContext);
  return bridge;
}
