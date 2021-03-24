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

import { TimelockSet, TimelockState } from '../models/timelock';
import { AccountLayout } from '@solana/spl-token';
import { depositGovernanceTokensInstruction } from '../models/depositGovernanceTokens';
import { LABELS } from '../constants';
const { createTokenAccount } = actions;
const { sendTransaction } = contexts.Connection;
const { notify } = utils;
const { approve } = models;

export const depositGovernanceTokens = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<TimelockSet>,
  state: ParsedAccount<TimelockState>,
  existingVoteAccount: PublicKey | undefined,
  existingYesVoteAccount: PublicKey | undefined,
  existingNoVoteAccount: PublicKey | undefined,
  sourceAccount: PublicKey,
  votingTokenAmount: number,
) => {
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  if (!existingVoteAccount) {
    existingVoteAccount = createTokenAccount(
      instructions,
      wallet.publicKey,
      accountRentExempt,
      proposal.info.votingMint,
      wallet.publicKey,
      signers,
    );
  }

  if (!existingYesVoteAccount) {
    createTokenAccount(
      instructions,
      wallet.publicKey,
      accountRentExempt,
      proposal.info.yesVotingMint,
      wallet.publicKey,
      signers,
    );
  }

  if (!existingNoVoteAccount) {
    createTokenAccount(
      instructions,
      wallet.publicKey,
      accountRentExempt,
      proposal.info.noVotingMint,
      wallet.publicKey,
      signers,
    );
  }

  const [mintAuthority] = await PublicKey.findProgramAddress(
    [PROGRAM_IDS.timelock.programAccountId.toBuffer()],
    PROGRAM_IDS.timelock.programId,
  );

  const transferAuthority = approve(
    instructions,
    [],
    sourceAccount,
    wallet.publicKey,
    votingTokenAmount,
  );

  signers.push(transferAuthority);

  instructions.push(
    depositGovernanceTokensInstruction(
      existingVoteAccount,
      sourceAccount,
      proposal.info.governanceHolding,
      proposal.info.votingMint,
      state.pubkey,
      proposal.pubkey,
      proposal.info.config,
      transferAuthority.publicKey,
      mintAuthority,
      votingTokenAmount,
    ),
  );

  notify({
    message: LABELS.ADDING_VOTES_TO_VOTER,
    description: LABELS.PLEASE_WAIT,
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      instructions,
      signers,
      true,
    );

    notify({
      message: LABELS.VOTES_ADDED,
      type: 'success',
      description: LABELS.TRANSACTION + ` ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
