import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  contexts,
  utils,
  ParsedAccount,
  actions,
  SequenceType,
} from '@oyster/common';

import { GovernanceOld } from '../models/governance';
import { AccountLayout, Token } from '@solana/spl-token';
import { LABELS } from '../constants';
const { createTokenAccount } = actions;
const { sendTransactions } = contexts.Connection;
const { notify } = utils;
export interface SourceEntryInterface {
  owner: PublicKey;
  sourceAccount: PublicKey | undefined;
  tokenAmount: number;
}
export const mintSourceTokens = async (
  connection: Connection,
  wallet: any,
  governance: ParsedAccount<GovernanceOld>,
  useGovernance: boolean,
  entries: SourceEntryInterface[],
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
    if (!e.sourceAccount)
      e.sourceAccount = createTokenAccount(
        instructions,
        wallet.publicKey,
        accountRentExempt,
        useGovernance
          ? governance.info.governanceMint
          : governance.info.councilMint!,
        e.owner,
        signers,
      );

    instructions.push(
      Token.createMintToInstruction(
        PROGRAM_IDS.token,
        useGovernance
          ? governance.info.governanceMint
          : governance.info.councilMint!,
        e.sourceAccount,
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
      SequenceType.Sequential,
      'singleGossip',
      (_txId: string, index: number) => {
        setSavePerc(Math.round(100 * ((index + 1) / allInstructions.length)));
      },
      (_reason: string, index: number) => {
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
