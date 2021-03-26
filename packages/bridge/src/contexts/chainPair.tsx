import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import bs58 from 'bs58';
import {
  programIds,
  useConnection,
  useConnectionConfig,
  useUserAccounts,
} from '@oyster/common';
import { TokenInfo } from '@solana/spl-token-registry';
import { ASSET_CHAIN, filterModalSolTokens } from '../utils/assets';
import { useEthereum } from './ethereum';
import { BigNumber } from 'ethers/utils';
import { WrappedAssetFactory } from '../contracts/WrappedAssetFactory';
import { WormholeFactory } from '../contracts/WormholeFactory';
import {
  bridgeAuthorityKey,
  TransferRequestInfo,
  wrappedAssetMintKey,
} from '../models/bridge';
export interface TokenChainContextState {
  info?: TransferRequestInfo;

  amount: number;
  setAmount: (val: number) => void;
  chain: ASSET_CHAIN;
  setChain: (val: number) => void;
}

export interface TokenChainPairContextState {
  A: TokenChainContextState;
  B: TokenChainContextState;
  mintAddress: string;
  setMintAddress: (mintAddress: string) => void;
  lastTypedAccount: number;
  setLastTypedAccount: (chain: ASSET_CHAIN) => void;
}

const TokenChainPairContext = React.createContext<TokenChainPairContextState | null>(
  null,
);

const isValidAddress = (address: string) => {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
};

export const toChainSymbol = (chain: number | null) => {
  if (chain === ASSET_CHAIN.Solana) {
    return 'SOL';
  }
  return 'ETH';
};

function getDefaultTokens(tokens: TokenInfo[], search: string) {
  let defaultChain = 'ETH';
  let defaultToken = tokens[0].symbol;

  const nameToToken = tokens.reduce((map, item) => {
    map.set(item.symbol, item);
    return map;
  }, new Map<string, any>());

  if (search) {
    const urlParams = new URLSearchParams(search);
    const from = urlParams.get('from');
    defaultChain = from === 'SOL' ? from : 'ETH';
    const token = urlParams.get('token') || defaultToken;
    if (nameToToken.has(token)) {
      defaultToken = token;
    }
  }
  return {
    defaultChain,
    defaultToken,
  };
}

export const useCurrencyLeg = (mintAddress: string) => {
  const [amount, setAmount] = useState(0);
  const [chain, setChain] = useState(ASSET_CHAIN.Ethereum);
  const [info, setInfo] = useState<TransferRequestInfo>();
  const { userAccounts } = useUserAccounts();

  const { provider, tokens: ethTokens } = useEthereum();
  const { tokens: solTokens } = useConnectionConfig();
  const connection = useConnection();

  useEffect(() => {
    if (!provider || !connection) {
      return;
    }

    (async () => {
      const ethToken = ethTokens.find(t => t.address === mintAddress);
      const solToken = solTokens.find(t => t.address === mintAddress);

      // eth assets on eth chain
      // eth asset on sol chain
      // sol asset on eth chain
      // sol asset on sol chain

      let ethAddress: string = '';
      if (solToken) {
        // let signer = provider.getSigner();
        // let e = WrappedAssetFactory.connect(asset, provider);
        // let addr = await signer.getAddress();
        // let decimals = await e.decimals();
        // let symbol = await e.symbol();

        // TODO: checked if mint is wrapped mint from eth...

        const accounts = userAccounts
          .filter(a => a.info.mint.toBase58() === solToken.address)
          .sort((a, b) => a.info.amount.toNumber() - b.info.amount.toNumber());

        console.log(accounts);
      }

      if (ethToken) {
        let signer = provider.getSigner();
        let e = WrappedAssetFactory.connect(mintAddress, provider);
        let addr = await signer.getAddress();
        let decimals = await e.decimals();
        let symbol = await e.symbol();
        const ethBridgeAddress = programIds().wormhole.bridge;
        let allowance = await e.allowance(addr, ethBridgeAddress);
        const assetAddress = Buffer.from(mintAddress.slice(2), 'hex');

        let info = {
          address: mintAddress,
          name: symbol,
          balance: new BigNumber(0),
          allowance,
          decimals,
          isWrapped: false,
          chainID: ASSET_CHAIN.Ethereum,
          assetAddress,
          mint: '',
        };

        let b = WormholeFactory.connect(ethBridgeAddress, provider);
        let isWrapped = await b.isWrappedAsset(mintAddress);
        if (isWrapped) {
          info.chainID = await e.assetChain();
          info.assetAddress = Buffer.from(addr.slice(2), 'hex');
          info.isWrapped = true;
        }

        if (chain === ASSET_CHAIN.Ethereum) {
          info.balance = await e.balanceOf(addr);
        } else {
          // TODO: get balance on other chains for assets that came from eth

          const bridgeId = programIds().wormhole.pubkey;
          const bridgeAuthority = await bridgeAuthorityKey(bridgeId);

          const mint = await wrappedAssetMintKey(bridgeId, bridgeAuthority, {
            decimals: Math.min(9, info.decimals),
            address: info.assetAddress,
            chain: info.chainID,
          });

          console.log(mint.toBase58());
        }

        console.log(info);

        setInfo(info);
      }
    })();
  }, [
    connection,
    provider,
    setInfo,
    chain,
    mintAddress,
    ethTokens,
    solTokens,
    userAccounts,
  ]);

  return useMemo(
    () => ({
      amount: amount,
      setAmount: setAmount,
      chain: chain,
      setChain: setChain,
      info,
    }),
    [amount, setAmount, chain, setChain],
  );
};

export function TokenChainPairProvider({ children = null as any }) {
  const { tokens: ethTokens } = useEthereum();
  const { tokens: solTokens } = useConnectionConfig();

  const history = useHistory();
  const location = useLocation();
  const [lastTypedAccount, setLastTypedAccount] = useState(0);
  const [mintAddress, setMintAddress] = useState('');

  const base = useCurrencyLeg(mintAddress);
  const amountA = base.amount;
  const setAmountA = base.setAmount;
  const chainA = base.chain;
  const setChainA = base.setChain;

  const quote = useCurrencyLeg(mintAddress);
  const amountB = quote.amount;
  const setAmountB = quote.setAmount;
  const setChainB = quote.setChain;

  const tokens = useMemo(
    () => [...ethTokens, ...filterModalSolTokens(solTokens)],
    [ethTokens, solTokens],
  );

  // updates browser history on token changes
  useEffect(() => {
    // set history
    const token = tokens.find(t => t.address === mintAddress)?.symbol;

    if (token && chainA) {
      history.push({
        search: `?from=${toChainSymbol(chainA)}&token=${token}`,
      });
    }
  }, [mintAddress, tokens, chainA]);

  // Updates tokens on location change
  useEffect(() => {
    if (
      !ethTokens.length ||
      (!location.search && mintAddress) ||
      location.pathname.indexOf('move') < 0
    ) {
      return;
    }
    let { defaultChain, defaultToken } = getDefaultTokens(
      ethTokens,
      location.search,
    );
    if (!defaultToken || !defaultChain) {
      return;
    }
    setChainA(
      defaultChain === 'ETH' ? ASSET_CHAIN.Ethereum : ASSET_CHAIN.Solana,
    );
    setChainB(
      defaultChain === 'SOL' ? ASSET_CHAIN.Ethereum : ASSET_CHAIN.Solana,
    );

    setMintAddress(
      tokens.find(t => t.symbol === defaultToken)?.address ||
        (isValidAddress(defaultToken) ? defaultToken : '') ||
        '',
    );
    // mintAddressA and mintAddressB are not included here to prevent infinite loop
    // eslint-disable-next-line
  }, [
    location,
    location.search,
    location.pathname,
    setMintAddress,
    tokens,
    setChainA,
    setChainB,
  ]);

  const calculateDependent = useCallback(async () => {
    if (mintAddress) {
      let setDependent;
      let amount;
      if (lastTypedAccount === base.chain) {
        setDependent = setAmountB;
        amount = amountA;
      } else {
        setDependent = setAmountA;
        amount = amountB;
      }

      const result: number | string = amount;
      if (typeof result === 'string') {
        setDependent(parseFloat(result));
      } else if (result !== undefined && Number.isFinite(result)) {
        setDependent(result);
      } else {
        setDependent(0);
      }
    }
  }, [mintAddress, setAmountA, setAmountB, amountA, amountB, lastTypedAccount]);

  useEffect(() => {
    calculateDependent();
  }, [amountB, amountA, lastTypedAccount, calculateDependent]);

  return (
    <TokenChainPairContext.Provider
      value={{
        A: base,
        B: quote,
        mintAddress,
        setMintAddress,
        lastTypedAccount,
        setLastTypedAccount,
      }}
    >
      {children}
    </TokenChainPairContext.Provider>
  );
}

export const useTokenChainPairState = () => {
  const context = useContext(TokenChainPairContext);

  return context as TokenChainPairContextState;
};
