import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  contexts,
  utils,
  models,
  ParsedAccount,
  actions,
} from '@oyster/common';

import { TimelockConfig } from '../models/timelock';
import { AccountLayout, Token } from '@solana/spl-token';
import { LABELS } from '../constants';
const { createTokenAccount } = actions;
const { sendTransactions } = contexts.Connection;
const { notify } = utils;
export interface GovernanceEntryInterface {
  owner: PublicKey;
  governanceAccount: PublicKey | undefined;
  tokenAmount: number;
}
export const mintGovernanceTokens = async (
  connection: Connection,
  wallet: any,
  timelockConfig: ParsedAccount<TimelockConfig>,
  entries: GovernanceEntryInterface[],
  setSavePerc: (num: number) => void,
  onFailedTxn: (index: number) => void,
) => {
  const PROGRAM_IDS = utils.programIds();

  let allSigners: Account[][] = [];
  let allInstructions: TransactionInstruction[][] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  entries.forEach(e => {
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    if (!e.governanceAccount)
      e.governanceAccount = createTokenAccount(
        instructions,
        wallet.publicKey,
        accountRentExempt,
        timelockConfig.info.governanceMint,
        e.owner,
        signers,
      );

    instructions.push(
      Token.createMintToInstruction(
        PROGRAM_IDS.token,
        timelockConfig.info.governanceMint,
        e.governanceAccount,
        wallet.publicKey,
        [],
        e.tokenAmount,
      ),
    );

    allSigners.push(signers);
    allInstructions.push(instructions);
  });

  notify({
    message: LABELS.ADDING_GOVERNANCE_TOKENS,
    description: LABELS.PLEASE_WAIT,
    type: 'warn',
  });

  try {
    await sendTransactions(
      connection,
      wallet,
      allInstructions,
      allSigners,
      true,
      'singleGossip',
      (_txId: string, index: number) => {
        setSavePerc(Math.round(100 * ((index + 1) / allInstructions.length)));
      },
      (_txId: string, index: number) => {
        setSavePerc(Math.round(100 * ((index + 1) / allInstructions.length)));
        onFailedTxn(index);
        return true; // keep going even on failed save
      },
    );

    notify({
      message: LABELS.GOVERNANCE_TOKENS_ADDED,
      type: 'success',
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
