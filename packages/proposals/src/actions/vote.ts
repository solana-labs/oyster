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

import { TimelockConfig, TimelockSet } from '../models/timelock';
import { LABELS } from '../constants';
import { voteInstruction } from '../models/vote';
const { createTokenAccount } = actions;
const { sendTransaction } = contexts.Connection;
const { notify } = utils;
const { approve } = models;

export const vote = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<TimelockSet>,
  timelockConfig: ParsedAccount<TimelockConfig>,
  votingAccount: PublicKey,
  yesVotingAccount: PublicKey,
  noVotingAccount: PublicKey,
  yesVotingTokenAmount: number,
  noVotingTokenAmount: number,
) => {
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const [mintAuthority] = await PublicKey.findProgramAddress(
    [PROGRAM_IDS.timelock.programAccountId.toBuffer()],
    PROGRAM_IDS.timelock.programId,
  );

  const transferAuthority = approve(
    instructions,
    [],
    votingAccount,
    wallet.publicKey,
    yesVotingTokenAmount + noVotingTokenAmount,
  );

  signers.push(transferAuthority);

  instructions.push(
    voteInstruction(
      proposal.pubkey,
      votingAccount,
      yesVotingAccount,
      noVotingAccount,
      proposal.info.votingMint,
      proposal.info.yesVotingMint,
      proposal.info.noVotingMint,
      timelockConfig.info.governanceMint,
      timelockConfig.pubkey,
      transferAuthority.publicKey,
      mintAuthority,
      yesVotingTokenAmount,
      noVotingTokenAmount,
    ),
  );

  notify({
    message: LABELS.BURNING_VOTES,
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
      message: LABELS.VOTES_BURNED,
      type: 'success',
      description: LABELS.TRANSACTION + ` ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
