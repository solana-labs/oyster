import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import bs58 from 'bs58';
import { useConnection, useConnectionConfig } from '@oyster/common';
import { TokenInfo } from '@solana/spl-token-registry';
import { ASSET_CHAIN, filterModalSolTokens } from '../utils/assets';
import { useEthereum } from './ethereum';

export interface TokenChainContextState {
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
    if (nameToToken.has(token) || isValidAddress(token)) {
      defaultToken = token;
    }
  }
  return {
    defaultChain,
    defaultToken,
  };
}

export const useCurrencyLeg = () => {
  const [amount, setAmount] = useState(0);
  const [chain, setChain] = useState(ASSET_CHAIN.Ethereum);

  return useMemo(
    () => ({
      amount: amount,
      setAmount: setAmount,
      chain: chain,
      setChain: setChain,
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

  const base = useCurrencyLeg();
  const amountA = base.amount;
  const setAmountA = base.setAmount;
  const chainA = base.chain;
  const setChainA = base.setChain;

  const quote = useCurrencyLeg();
  const amountB = quote.amount;
  const setAmountB = quote.setAmount;
  const chainB = quote.chain;
  const setChainB = quote.setChain;

  const tokens = useMemo(
    () => [...ethTokens, ...filterModalSolTokens(solTokens)],
    [ethTokens, solTokens],
  );

  // updates browser history on token changes
  useEffect(() => {
    // set history
    const token =
      tokens.find(t => t.address === mintAddress)?.symbol || mintAddress;

    if (token && chainA) {
      history.push({
        search: `?from=${toChainSymbol(chainA)}&token=${token}`,
      });
    } else {
      if (mintAddress) {
        history.push({
          search: ``,
        });
      } else {
        return;
      }
    }
  }, [mintAddress, tokens, chainA]);

  // Updates tokens on location change
  useEffect(() => {
    if (
      !tokens.length ||
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
