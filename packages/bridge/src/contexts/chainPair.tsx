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
import {
  ASSET_CHAIN,
  filterModalEthTokens,
  filterModalSolTokens,
} from '../utils/assets';
import { useEthereum } from './ethereum';
import { BigNumber } from 'bignumber.js';
import { AssetMeta, WrappedAssetFactory } from '@solana/bridge-sdk';
import { WormholeFactory } from '@solana/bridge-sdk';
import {
  bridgeAuthorityKey,
  TransferRequestInfo,
  wrappedAssetMintKey,
} from '@solana/bridge-sdk';
import { useBridge } from './bridge';
import { PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';

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
  const bridge = useBridge();

  const { provider, tokens: ethTokens } = useEthereum();
  const { tokens: solTokens } = useConnectionConfig();
  const connection = useConnection();
  const defaultCoinInfo = {
    address: '',
    name: '',
    balance: new BigNumber(0),
    decimals: 0,
    allowance: new ethers.utils.BigNumber(0),
    isWrapped: false,
    chainID: 0,
    assetAddress: new Buffer(0),
    mint: '',
  };
  useEffect(() => {
    if (!provider || !connection) {
      return;
    }

    (async () => {
      const ethToken = ethTokens.find(t => t.address === mintAddress);
      let solToken = solTokens.find(t => t.address === mintAddress);
      let mintKeyAddress = '';
      let symbol = '';
      let decimals = 0;

      //console.log({ chain, solToken, ethToken });
      if (chain === ASSET_CHAIN.Solana) {
        if (!solToken && ethToken) {
          try {
            const bridgeId = programIds().wormhole.pubkey;
            const authority = await bridgeAuthorityKey(bridgeId);
            const assetAddress = Buffer.from(ethToken.address.slice(2), 'hex');
            const meta: AssetMeta = {
              decimals: Math.min(ethToken.decimals, 9),
              address: assetAddress,
              chain: ASSET_CHAIN.Ethereum,
            };
            const mintKey = await wrappedAssetMintKey(
              bridgeId,
              authority,
              meta,
            );
            if (mintKey) {
              mintKeyAddress = mintKey.toBase58();
              solToken = solTokens.find(t => t.address === mintKeyAddress);
              if (!solToken) {
                symbol = ethToken.symbol;
                decimals = Math.min(ethToken.decimals, 9);
              }
            } else {
              setInfo(defaultCoinInfo);
              return;
            }
          } catch {
            setInfo(defaultCoinInfo);
            return;
          }
        }
        if (!solToken && (!symbol || !mintKeyAddress || !decimals)) {
          setInfo(defaultCoinInfo);
          return;
        }
        const currentAccount = userAccounts?.find(
          a => a.info.mint.toBase58() === (solToken?.address || mintKeyAddress),
        );

        const assetMeta = await bridge?.fetchAssetMeta(
          new PublicKey(solToken?.address || mintKeyAddress),
        );

        if (!assetMeta || !currentAccount) {
          setInfo(defaultCoinInfo);
          return;
        }
        let info = {
          address: currentAccount.pubkey.toBase58(),
          name: solToken?.symbol || symbol,
          balance: new BigNumber(currentAccount?.info.amount.toNumber() || 0),
          allowance: new ethers.utils.BigNumber(0),
          decimals: solToken?.decimals || decimals,
          isWrapped: assetMeta.chain != ASSET_CHAIN.Solana,
          chainID: assetMeta.chain,
          assetAddress: assetMeta.address,
          mint: solToken?.address || mintKeyAddress,
        };
        setInfo(info);
      }

      if (chain === ASSET_CHAIN.Ethereum) {
        if (!ethToken) {
          setInfo(defaultCoinInfo);
          return;
        }
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
          info.balance = new BigNumber(
            new ethers.utils.BigNumber(await e.balanceOf(addr)).toString(),
          );
        } else {
          // TODO: get balance on other chains for assets that came from eth

          const bridgeId = programIds().wormhole.pubkey;
          const bridgeAuthority = await bridgeAuthorityKey(bridgeId);

          const mint = await wrappedAssetMintKey(bridgeId, bridgeAuthority, {
            decimals: Math.min(9, info.decimals),
            address: info.assetAddress,
            chain: info.chainID,
          });
        }

        //console.log({ info });
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

  return {
    amount: amount,
    setAmount: setAmount,
    chain: chain,
    setChain: setChain,
    info,
  };
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
    () => [
      ...filterModalEthTokens(ethTokens),
      ...filterModalSolTokens(solTokens),
    ],
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
      tokens,
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
  }, [location, location.search, location.pathname, tokens]);

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
