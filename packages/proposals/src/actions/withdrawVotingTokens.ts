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
import { withdrawVotingTokensInstruction } from '../models/withdrawVotingTokens';
import { LABELS } from '../constants';
const { createTokenAccount } = actions;
const { sendTransaction } = contexts.Connection;
const { notify } = utils;
const { approve } = models;

export const withdrawVotingTokens = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<TimelockSet>,
  state: ParsedAccount<TimelockState>,
  existingVoteAccount: PublicKey | undefined,
  existingYesVoteAccount: PublicKey | undefined,
  existingNoVoteAccount: PublicKey | undefined,
  destinationAccount: PublicKey,
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
    existingYesVoteAccount = createTokenAccount(
      instructions,
      wallet.publicKey,
      accountRentExempt,
      proposal.info.yesVotingMint,
      wallet.publicKey,
      signers,
    );
  }

  if (!existingNoVoteAccount) {
    existingNoVoteAccount = createTokenAccount(
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

  // We dont know in this scope how much is in each account so we just ask for all in each.
  // Should be alright, this is just permission, not actual moving.
  const transferAuthority = approve(
    instructions,
    [],
    existingVoteAccount,
    wallet.publicKey,
    votingTokenAmount,
  );

  const yesTransferAuthority = approve(
    instructions,
    [],
    existingYesVoteAccount,
    wallet.publicKey,
    votingTokenAmount,
  );

  const noTransferAuthority = approve(
    instructions,
    [],
    existingNoVoteAccount,
    wallet.publicKey,
    votingTokenAmount,
  );

  signers.push(transferAuthority);
  signers.push(yesTransferAuthority);
  signers.push(noTransferAuthority);

  instructions.push(
    withdrawVotingTokensInstruction(
      existingVoteAccount,
      existingYesVoteAccount,
      existingNoVoteAccount,
      destinationAccount,
      proposal.info.sourceHolding,
      proposal.info.yesVotingDump,
      proposal.info.noVotingDump,
      proposal.info.votingMint,
      proposal.info.yesVotingMint,
      proposal.info.noVotingMint,
      state.pubkey,
      proposal.pubkey,
      transferAuthority.publicKey,
      yesTransferAuthority.publicKey,
      noTransferAuthority.publicKey,
      mintAuthority,
      votingTokenAmount,
    ),
  );

  notify({
    message: LABELS.WITHDRAWING_VOTING_TOKENS,
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
      message: LABELS.TOKENS_WITHDRAWN,
      type: 'success',
      description: LABELS.TRANSACTION + ` ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
