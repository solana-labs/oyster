import { contexts, ParsedAccount } from '@oyster/common';
import {
  Obligation,
  refreshObligationInstruction,
  refreshReserveInstruction,
  Reserve,
} from '@solana/spl-token-lending';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ReserveParser } from '../models';

const { cache } = contexts.Accounts;

export const refreshObligationAndReserves = async (
  connection: Connection,
  obligation: ParsedAccount<Obligation>,
) => {
  const instructions = [] as TransactionInstruction[];
  const reserves = {} as Record<string, PublicKey>;

  for (const collateral of obligation.info.deposits) {
    reserves[collateral.depositReserve.toBase58()] = collateral.depositReserve;
  }
  for (const liquidity of obligation.info.borrows) {
    reserves[liquidity.borrowReserve.toBase58()] = liquidity.borrowReserve;
  }

  await Promise.all(
    Object.values(reserves).map(async pubkey => {
      const reserve = (await cache.query(
        connection,
        pubkey,
        ReserveParser,
      )) as ParsedAccount<Reserve>;

      instructions.push(
        refreshReserveInstruction(pubkey, reserve.info.liquidity.oraclePubkey),
      );
    }),
  );

  instructions.push(
    refreshObligationInstruction(
      obligation.pubkey,
      obligation.info.deposits.map(collateral => collateral.depositReserve),
      obligation.info.borrows.map(liquidity => liquidity.borrowReserve),
    ),
  );

  return instructions;
};
