import {useEffect, useState} from "react";
import {contexts} from "@oyster/common";
import * as BufferLayout from 'buffer-layout'
import {WORMHOLE_PROGRAM_ID} from "../utils/ids";
import BN from "bn.js";
import {ASSET_CHAIN, getAssetAmountInUSD, getAssetName, getAssetTokenSymbol} from "../utils/assets";
import { useEthereum } from "../contexts";
import { PublicKey } from "@solana/web3.js";

const { useConnection } = contexts.Connection;

interface ParsedData {
  amount: number,
  rawAmount: string,
  parsedAssetAddress: string,
  parsedAccount: any,
  assetDecimals: number,
  name: string,
  symbol: string,
  sourceAddress: string,
  targetAddress: string,
  amountInUSD: number,
}

export const useLockedFundsAccounts = () => {
  const connection = useConnection();
  const { tokenMap: ethTokens } = useEthereum();

  const [lockedSolanaAccounts, setLockedSolanaAccounts] = useState<ParsedData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const queryTxs = async () => {
      setLoading(true);
      const programAccounts = await connection.getProgramAccounts(
        WORMHOLE_PROGRAM_ID
      );
      const dataLayout = BufferLayout.struct([
          BufferLayout.blob(32, 'amount'),
          BufferLayout.u8('toChain'),
          BufferLayout.blob(32, 'sourceAddress'),
          BufferLayout.blob(32, 'targetAddress'),
          BufferLayout.blob(32, 'assetAddress'),
          BufferLayout.u8('assetChain'),
          BufferLayout.u8('assetDecimals'),
          BufferLayout.seq(BufferLayout.u8(), 1), // 4 byte alignment because a u32 is following
          BufferLayout.u32('nonce'),
          BufferLayout.blob(1001, 'vaa'),
          BufferLayout.seq(BufferLayout.u8(), 3), // 4 byte alignment because a u32 is following
          BufferLayout.u32('vaaTime'),
          BufferLayout.u32('lockupTime'),
          BufferLayout.u8('pokeCounter'),
          BufferLayout.blob(32, 'signatureAccount'),
          BufferLayout.u8('initialized'),
      ]);
      const filteredParsedAccounts: ParsedData[] = [];
      programAccounts.map(acc => {
        try {
          const parsedAccount = dataLayout.decode(acc.account.data)
          const chains = [ASSET_CHAIN.Solana, ASSET_CHAIN.Ethereum]
          if (chains.indexOf(parsedAccount.assetChain) >= 0 &&
            chains.indexOf(parsedAccount.toChain) >= 0) {
            const dec = new BN(10).pow(new BN(parsedAccount.assetDecimals));
            const rawAmount = new BN(parsedAccount.amount, 2, "le")
            const amount = rawAmount.div(dec).toNumber();
            const parsedAssetAddress: string = parsedAccount.assetChain === ASSET_CHAIN.Solana ?
                        new PublicKey(parsedAccount.targetAddress).toString() :
                        new Buffer(parsedAccount.assetAddress.slice(12)).toString("hex")
            const parsedData: ParsedData = {
              amount: amount,
              rawAmount: rawAmount.toString(),
              parsedAssetAddress: parsedAssetAddress,
              parsedAccount: parsedAccount,
              assetDecimals: parsedAccount.assetDecimals,
              sourceAddress: new PublicKey(parsedAccount.sourceAddress).toString(),
              targetAddress: parsedAccount.toChain === ASSET_CHAIN.Solana ?
                new PublicKey(parsedAccount.targetAddress).toString()
                : new Buffer(parsedAccount.targetAddress.slice(12)).toString("hex"),
              name: getAssetName(parsedAssetAddress, parsedAccount.assetChain),
              symbol: getAssetTokenSymbol(parsedAssetAddress, parsedAccount.assetChain),
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
  }, []);
  return {
    loading,
    lockedSolanaAccounts,
    total: lockedSolanaAccounts.reduce((acc, val) => {
      return acc + val.amountInUSD;
    }, 0)
  };
}
