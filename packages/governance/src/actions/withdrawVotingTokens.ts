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

import {
  ProposalOld,
  ProposalState,
  ProposalStateStatus,
} from '../models/serialisation';
import { AccountLayout } from '@solana/spl-token';
import { withdrawVotingTokensInstruction } from '../models/withdrawVotingTokens';
import { LABELS } from '../constants';
import { GOVERNANCE_PROGRAM_SEED } from '../models/accounts';
const { createTokenAccount } = actions;
const { sendTransaction } = contexts.Connection;
const { notify } = utils;
const { approve } = models;

export const withdrawVotingTokens = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<ProposalOld>,
  state: ParsedAccount<ProposalState>,
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
    [Buffer.from(GOVERNANCE_PROGRAM_SEED), proposal.pubkey.toBuffer()],
    PROGRAM_IDS.governance.programId,
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

  approve(
    instructions,
    [],
    existingYesVoteAccount,
    wallet.publicKey,
    votingTokenAmount,
    undefined,
    undefined,
    transferAuthority,
  );

  approve(
    instructions,
    [],
    existingNoVoteAccount,
    wallet.publicKey,
    votingTokenAmount,
    undefined,
    undefined,
    transferAuthority,
  );

  const [governanceVotingRecord] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      PROGRAM_IDS.governance.programId.toBuffer(),
      proposal.pubkey.toBuffer(),
      existingVoteAccount.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
  );

  signers.push(transferAuthority);

  instructions.push(
    withdrawVotingTokensInstruction(
      governanceVotingRecord,
      existingVoteAccount,
      existingYesVoteAccount,
      existingNoVoteAccount,
      destinationAccount,
      proposal.info.sourceHolding,
      proposal.info.votingMint,
      proposal.info.yesVotingMint,
      proposal.info.noVotingMint,
      state.pubkey,
      proposal.pubkey,
      transferAuthority.publicKey,
      mintAuthority,
      votingTokenAmount,
    ),
  );

  const [msg, completedMsg] =
    state.info.status === ProposalStateStatus.Voting
      ? [LABELS.WITHDRAWING_YOUR_VOTE, LABELS.VOTE_WITHDRAWN]
      : [LABELS.REFUNDING_YOUR_TOKENS, LABELS.TOKENS_REFUNDED];

  notify({
    message: msg,
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
      message: completedMsg,
      type: 'success',
      description: LABELS.TRANSACTION + ` ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
