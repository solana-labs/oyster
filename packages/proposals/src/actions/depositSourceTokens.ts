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
import { depositSourceTokensInstruction } from '../models/depositSourceTokens';
import { LABELS } from '../constants';
import { createEmptyGovernanceVotingRecordInstruction } from '../models/createEmptyGovernanceVotingRecord';
const { createTokenAccount } = actions;
const { sendTransaction } = contexts.Connection;
const { notify } = utils;
const { approve } = models;

export const depositSourceTokens = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<TimelockSet>,
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

  let needToCreateGovAccountToo = !existingVoteAccount;
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

  const [governanceVotingRecord] = await PublicKey.findProgramAddress(
    [
      PROGRAM_IDS.timelock.programAccountId.toBuffer(),
      proposal.pubkey.toBuffer(),
      existingVoteAccount.toBuffer(),
    ],
    PROGRAM_IDS.timelock.programId,
  );

  if (needToCreateGovAccountToo) {
    instructions.push(
      createEmptyGovernanceVotingRecordInstruction(
        governanceVotingRecord,
        proposal.pubkey,
        existingVoteAccount,
        wallet.publicKey,
      ),
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
    depositSourceTokensInstruction(
      governanceVotingRecord,
      existingVoteAccount,
      sourceAccount,
      proposal.info.sourceHolding,
      proposal.info.votingMint,
      proposal.pubkey,
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
