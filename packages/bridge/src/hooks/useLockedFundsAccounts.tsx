import React, {useEffect, useState} from "react";
import {contexts, TokenIcon, useConnectionConfig} from "@oyster/common";
import * as BufferLayout from 'buffer-layout'
import {WORMHOLE_PROGRAM_ID} from "../utils/ids";
import BN from "bn.js";
import {ASSET_CHAIN, getAssetAmountInUSD, getAssetName, getAssetTokenSymbol} from "../utils/assets";
import { useEthereum } from "../contexts";
import { PublicKey } from "@solana/web3.js";
import { models } from "@oyster/common";

const ParsedDataLayout = models.ParsedDataLayout

const { useConnection } = contexts.Connection;

export const useLockedFundsAccounts = () => {
  const connection = useConnection();
  const { tokenMap: ethTokens } = useEthereum();
  const {tokenMap: solanaTokens} = useConnectionConfig();

  const [lockedSolanaAccounts, setLockedSolanaAccounts] = useState<models.ParsedDataAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const queryTxs = async () => {
      if (!solanaTokens.size || !ethTokens.size) {
        return []
      }
      setLoading(true);
      const programAccounts = await connection.getProgramAccounts(
        WORMHOLE_PROGRAM_ID
      );

      const filteredParsedAccounts: models.ParsedDataAccount[] = [];
      programAccounts.map(acc => {
        try {
          const parsedAccount = ParsedDataLayout.decode(acc.account.data)
          const chains = [ASSET_CHAIN.Solana, ASSET_CHAIN.Ethereum]
          if (chains.indexOf(parsedAccount.assetChain) >= 0 &&
            chains.indexOf(parsedAccount.toChain) >= 0) {
            const dec = new BN(10).pow(new BN(parsedAccount.assetDecimals));
            const rawAmount = new BN(parsedAccount.amount, 2, "le")
            const amount = rawAmount.div(dec).toNumber();
            const parsedAssetAddress: string = parsedAccount.assetChain === ASSET_CHAIN.Solana ?
                        new PublicKey(parsedAccount.assetAddress).toString() :
                        new Buffer(parsedAccount.assetAddress.slice(12)).toString("hex")

            const parsedData: models.ParsedDataAccount = {
              amount: amount,
              rawAmount: rawAmount.toString(),
              parsedAssetAddress: parsedAssetAddress,
              parsedAccount: parsedAccount,
              assetDecimals: parsedAccount.assetDecimals,
              assetIcon: parsedAccount.assetChain === ASSET_CHAIN.Solana ?
                <TokenIcon mintAddress={parsedAssetAddress} /> :
                <TokenIcon mintAddress={`0x${parsedAssetAddress}`} tokenMap={ethTokens} />,
              sourceAddress: new PublicKey(parsedAccount.sourceAddress).toString(),
              targetAddress: parsedAccount.toChain === ASSET_CHAIN.Solana ?
                new PublicKey(parsedAccount.targetAddress).toString()
                : new Buffer(parsedAccount.targetAddress.slice(12)).toString("hex"),
              name: getAssetName(parsedAssetAddress, parsedAccount.assetChain, solanaTokens, ethTokens),
              symbol: getAssetTokenSymbol(parsedAssetAddress, parsedAccount.assetChain, solanaTokens, ethTokens),
              amountInUSD: getAssetAmountInUSD(amount, parsedAssetAddress, parsedAccount.assetChain),
            };
            filteredParsedAccounts.push(parsedData)
          }
        } catch (error){
          return
        }
      });
      return filteredParsedAccounts;
    }
    Promise.all([queryTxs()]).then((all) => {
      setLoading(false);
      setLockedSolanaAccounts(all[0])
    });
  }, [solanaTokens, ethTokens]);
  return {
    loading,
    lockedSolanaAccounts,
    total: lockedSolanaAccounts.reduce((acc, val) => {
      return acc + val.amountInUSD;
    }, 0)
  };
}
