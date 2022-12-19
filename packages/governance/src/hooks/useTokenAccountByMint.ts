import { InstructionData } from '@solana/spl-governance';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  AccountInfo,
  AccountLayout,
  MintInfo,
  MintLayout,
  u64,
} from '@solana/spl-token';
import BN from 'bn.js';
import { getMintDecimalAmountFromNatural } from '../tools/units';
import { useConnection } from '@oyster/common';
import { BigNumber } from 'bignumber.js';
import { useEffect, useState } from 'react';

export type MintAccount = MintInfo;
export type TokenAccount = AccountInfo;

export type TokenProgramAccount<T> = {
  publicKey: PublicKey;
  account: T;
};

export interface TokenMintMetadata {
  name: string;
}

export function parseTokenAccountData(
  account: PublicKey,
  data: Buffer,
): TokenAccount {
  const accountInfo = AccountLayout.decode(data);
  accountInfo.address = account;
  accountInfo.mint = new PublicKey(accountInfo.mint);
  accountInfo.owner = new PublicKey(accountInfo.owner);
  accountInfo.amount = u64.fromBuffer(accountInfo.amount);

  return accountInfo;
}

export async function tryGetTokenAccount(
  connection: Connection,
  publicKey: PublicKey,
  tokenProgramId: PublicKey,
): Promise<TokenProgramAccount<TokenAccount> | undefined> {
  try {
    const result = await connection.getAccountInfo(publicKey);

    if (!result?.owner.equals(tokenProgramId)) {
      return undefined;
    }

    const data = Buffer.from(result!.data);
    const account = parseTokenAccountData(publicKey, data);
    return {
      publicKey,
      account,
    };
  } catch (ex) {
    console.error(`Can't fetch token account ${publicKey?.toBase58()}`, ex);
  }
}

export function parseMintAccountData(data: Buffer): MintAccount {
  const mintInfo = MintLayout.decode(data);
  if (mintInfo.mintAuthorityOption === 0) {
    mintInfo.mintAuthority = null;
  } else {
    mintInfo.mintAuthority = new PublicKey(mintInfo.mintAuthority);
  }

  mintInfo.supply = u64.fromBuffer(mintInfo.supply);
  mintInfo.isInitialized = mintInfo.isInitialized !== 0;

  if (mintInfo.freezeAuthorityOption === 0) {
    mintInfo.freezeAuthority = null;
  } else {
    mintInfo.freezeAuthority = new PublicKey(mintInfo.freezeAuthority);
  }
  return mintInfo;
}

export async function tryGetMint(
  connection: Connection,
  publicKey: PublicKey,
): Promise<TokenProgramAccount<MintAccount> | undefined> {
  try {
    const result = await connection.getAccountInfo(publicKey);
    const data = Buffer.from(result!.data);
    const account = parseMintAccountData(data);
    return {
      publicKey,
      account,
    };
  } catch (ex) {
    console.error(`Can't fetch mint ${publicKey?.toBase58()}`, ex);
    return undefined;
  }
}

export function useTokenAccountByMint(
  proposalInstruction: InstructionData,
): {
  tokenMint: TokenProgramAccount<MintAccount> | undefined;
  tokenAmount: BN | BigNumber | undefined;
} {
  const connection = useConnection();
  const [tokenMint, setTokenMint] = useState<
    TokenProgramAccount<MintAccount> | undefined
  >();

  useEffect(() => {
    (async () => {
      const resolvedTokenAccount = await tryGetTokenAccount(
        connection,
        proposalInstruction.accounts[0].pubkey, //token sender account
        proposalInstruction.programId,
      );

      const resolvedTokenMint = resolvedTokenAccount
        ? await tryGetMint(connection, resolvedTokenAccount!.account.mint)
        : undefined;

      setTokenMint(resolvedTokenMint);
    })();
  }, [connection, proposalInstruction.accounts, proposalInstruction.programId]);

  const rawAmount = new BN(proposalInstruction!.data.slice(1), 'le');

  const tokenAmount = tokenMint
    ? getMintDecimalAmountFromNatural(tokenMint.account, rawAmount)
    : rawAmount;

  return { tokenMint, tokenAmount };
}
