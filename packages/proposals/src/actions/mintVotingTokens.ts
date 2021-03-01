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

import { TimelockSet } from '../models/timelock';
import { AccountLayout } from '@solana/spl-token';
import { mintVotingTokensInstruction } from '../models/mintVotingTokens';
import { LABELS } from '../constants';
const { createTokenAccount } = actions;
const { sendTransaction } = contexts.Connection;
const { notify } = utils;
const { approve } = models;

export const mintVotingTokens = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<TimelockSet>,
  signatoryAccount: PublicKey,
  newVotingAccountOwner: PublicKey,
  existingVoteAccount: PublicKey | undefined,
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
      newVotingAccountOwner,
      signers,
    );

    notify({
      message: LABELS.ADDING_NEW_VOTE_ACCOUNT,
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
        message: LABELS.NEW_VOTED_ACCOUNT_ADDED,
        type: 'success',
        description: LABELS.TRANSACTION + ` ${tx}`,
      });
    } catch (ex) {
      console.error(ex);
      throw new Error();
    }

    signers = [];
    instructions = [];
  }

  const [mintAuthority] = await PublicKey.findProgramAddress(
    [PROGRAM_IDS.timelock.programAccountId.toBuffer()],
    PROGRAM_IDS.timelock.programId,
  );

  const transferAuthority = approve(
    instructions,
    [],
    signatoryAccount,
    wallet.publicKey,
    1,
  );

  signers.push(transferAuthority);

  instructions.push(
    mintVotingTokensInstruction(
      proposal.pubkey,
      existingVoteAccount,
      proposal.info.votingMint,
      signatoryAccount,
      proposal.info.signatoryValidation,
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
