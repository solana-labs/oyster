import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MintInfo } from "@solana/spl-token";
import { useHistory, useLocation } from "react-router-dom";
import bs58 from "bs58";
import { TokenAccount } from "@oyster/common";
import { KnownToken } from '@solana/spl-token-registry';
import { useConnection, useConnectionConfig, useAccountByMint, useMint, getTokenName, getTokenIcon, convert } from "@oyster/common";

export interface TokenContextState {
  mintAddress: string;
  account?: TokenAccount;
  mint?: MintInfo;
  amount: string;
  name: string;
  icon?: string;
  setAmount: (val: string) => void;
  setMint: (mintAddress: string) => void;
  convertAmount: () => number;
  sufficientBalance: () => boolean;
}

export interface TokenPairContextState {
  A: TokenContextState;
  B: TokenContextState;
  lastTypedAccount: string;
  setLastTypedAccount: (mintAddress: string) => void;
}

const TokenPairContext = React.createContext<TokenPairContextState | null>(
  null
);

const convertAmount = (amount: string, mint?: MintInfo) => {
  return parseFloat(amount) * Math.pow(10, mint?.decimals || 0);
};

export const useCurrencyLeg = (defaultMint?: string) => {
  const { tokenMap } = useConnectionConfig();
  const [amount, setAmount] = useState("");
  const [mintAddress, setMintAddress] = useState(defaultMint || "");
  const account = useAccountByMint(mintAddress);
  const mint = useMint(mintAddress);

  return useMemo(
    () => ({
      mintAddress: mintAddress,
      account: account,
      mint: mint,
      amount: amount,
      name: getTokenName(tokenMap, mintAddress),
      icon: getTokenIcon(tokenMap, mintAddress),
      setAmount: setAmount,
      setMint: setMintAddress,
      convertAmount: () => convertAmount(amount, mint),
      sufficientBalance: () =>
        account !== undefined &&
        (convert(account, mint) >= parseFloat(amount))
    }),
    [
      mintAddress,
      account,
      mint,
      amount,
      tokenMap,
      setAmount,
      setMintAddress,
    ]
  );
};

export function TokenPairProvider({ children = null as any }) {
  const connection = useConnection();
  const { tokens } = useConnectionConfig();

  const history = useHistory();
  const location = useLocation();
  const [lastTypedAccount, setLastTypedAccount] = useState("");

  const base = useCurrencyLeg();
  const mintAddressA = base.mintAddress;
  const setMintAddressA = base.setMint;
  const amountA = base.amount;
  const setAmountA = base.setAmount;

  const quote = useCurrencyLeg();
  const mintAddressB = quote.mintAddress;
  const setMintAddressB = quote.setMint;
  const amountB = quote.amount;
  const setAmountB = quote.setAmount;

  useEffect(() => {
    const base =
      tokens.find((t) => t.mintAddress === mintAddressA)?.tokenSymbol ||
      mintAddressA;
    const quote =
      tokens.find((t) => t.mintAddress === mintAddressB)?.tokenSymbol ||
      mintAddressB;

    document.title = `Swap | Serum (${base}/${quote})`;
  }, [mintAddressA, mintAddressB, tokens, location]);

  // updates browser history on token changes
  useEffect(() => {
    // set history
    const base =
      tokens.find((t) => t.mintAddress === mintAddressA)?.tokenSymbol ||
      mintAddressA;
    const quote =
      tokens.find((t) => t.mintAddress === mintAddressB)?.tokenSymbol ||
      mintAddressB;

    if (base && quote && location.pathname.indexOf("info") < 0) {
      history.push({
        search: `?pair=${base}-${quote}`,
      });
    } else {
      if (mintAddressA && mintAddressB) {
        history.push({
          search: ``,
        });
      } else {
        return;
      }
    }
  }, [mintAddressA, mintAddressB, tokens, history, location.pathname]);

  // Updates tokens on location change
  useEffect(() => {
    if (!location.search && mintAddressA && mintAddressB) {
      return;
    }

    let { defaultBase, defaultQuote } = getDefaultTokens(
      tokens,
      location.search
    );
    if (!defaultBase || !defaultQuote) {
      return;
    }

    setMintAddressA(
      tokens.find((t) => t.tokenSymbol === defaultBase)?.mintAddress ||
        (isValidAddress(defaultBase) ? defaultBase : "") ||
        ""
    );
    setMintAddressB(
      tokens.find((t) => t.tokenSymbol === defaultQuote)?.mintAddress ||
        (isValidAddress(defaultQuote) ? defaultQuote : "") ||
        ""
    );
    // mintAddressA and mintAddressB are not included here to prevent infinite loop
    // eslint-disable-next-line
  }, [location, location.search, setMintAddressA, setMintAddressB, tokens]);

  const calculateDependent = useCallback(async () => {
    if (mintAddressA && mintAddressB) {
      let setDependent;
      let amount;
      let independent;
      if (lastTypedAccount === mintAddressA) {
        independent = mintAddressA;
        setDependent = setAmountB;
        amount = parseFloat(amountA);
      } else {
        independent = mintAddressB;
        setDependent = setAmountA;
        amount = parseFloat(amountB);
      }

      // TODO: calculate
      const result: number | string = 0;
      if (typeof result === "string") {
        setDependent(result);
      } else if (result !== undefined && Number.isFinite(result)) {
        setDependent(result.toFixed(6));
      } else {
        setDependent("");
      }
    }
  }, [
    mintAddressA,
    mintAddressB,
    setAmountA,
    setAmountB,
    amountA,
    amountB,
    connection,
    lastTypedAccount,
  ]);

  useEffect(() => {
    calculateDependent();
  }, [amountB, amountA, lastTypedAccount, calculateDependent]);

  return (
    <TokenPairContext.Provider
      value={{
        A: base,
        B: quote,
        lastTypedAccount,
        setLastTypedAccount,
      }}
    >
      {children}
    </TokenPairContext.Provider>
  );
}

export const useCurrencyPairState = () => {
  const context = useContext(TokenPairContext);

  return context as TokenPairContextState;
};

const isValidAddress = (address: string) => {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
};

function getDefaultTokens(tokens: KnownToken[], search: string) {
  let defaultBase = "SOL";
  let defaultQuote = "USDC";

  const nameToToken = tokens.reduce((map, item) => {
    map.set(item.tokenSymbol, item);
    return map;
  }, new Map<string, any>());

  if (search) {
    const urlParams = new URLSearchParams(search);
    const pair = urlParams.get("pair");
    if (pair) {
      let items = pair.split("-");

      if (items.length > 1) {
        if (nameToToken.has(items[0]) || isValidAddress(items[0])) {
          defaultBase = items[0];
        }

        if (nameToToken.has(items[1]) || isValidAddress(items[1])) {
          defaultQuote = items[1];
        }
      }
    }
  }
  return {
    defaultBase,
    defaultQuote,
  };
}
