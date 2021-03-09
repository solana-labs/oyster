import React, {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
} from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { SolanaBridge } from '../core';
import {
  useConnection,
  useConnectionConfig,
} from '@oyster/common/dist/lib/contexts/connection';
import { utils } from '@oyster/common';
import { MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WORMHOLE_PROGRAM_ID } from '../utils/ids';

export const BridgeContext = createContext<SolanaBridge | undefined>(undefined);

export const BridgeProvider: FunctionComponent = ({ children }) => {
  const { endpoint } = useConnectionConfig();
  const connection = useConnection();
  const programs = utils.programIds();

  ///   let bridge = new SolanaBridge(endpoint, connection, programs.wormhole.pubkey, programs.token);

  return (
    <BridgeContext.Provider value={undefined}>
      {children}
    </BridgeContext.Provider>
  );
};

export const useBridge = () => {
  const bridge = useContext(BridgeContext);
  return bridge;
};
