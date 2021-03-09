import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useConnection,
  useConnectionConfig,
  MintParser,
  cache,
  getMultipleAccounts,
  ParsedAccount,
  TokenAccountParser,
} from '@oyster/common';
import { WORMHOLE_PROGRAM_ID } from '../utils/ids';
import { ASSET_CHAIN } from '../utils/assets';
import { useEthereum } from '../contexts';
import { Connection, PublicKey } from '@solana/web3.js';
import { models } from '@oyster/common';
import { AccountInfo, MintInfo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WrappedMetaLayout } from './../models/bridge';
import bs58 from 'bs58';
import {
  COINGECKO_COIN_PRICE_API,
  COINGECKO_POOL_INTERVAL,
  useCoingecko,
} from '../contexts/coingecko';

export const useEthUserAccount = () => {
  const [address, setAddress] = useState('');
  // const { web3 } = useEthereum();

  return address;
};
