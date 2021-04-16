import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, models, ParsedAccount } from '@oyster/common';

import { TimelockSet, TimelockState } from '../models/timelock';
import { signInstruction } from '../models/sign';

const { sendTransaction } = contexts.Connection;
const { notify } = utils;
const { approve } = models;

export const sign = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<TimelockSet>,
  state: ParsedAccount<TimelockState>,
  sigAccount: PublicKey,
) => {
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const [mintAuthority] = await PublicKey.findProgramAddress(
    [proposal.pubkey.toBuffer()],
    PROGRAM_IDS.timelock.programId,
  );

  const transferAuthority = approve(
    instructions,
    [],
    sigAccount,
    wallet.publicKey,
    1,
  );
  signers.push(transferAuthority);

  instructions.push(
    signInstruction(
      state.pubkey,
      sigAccount,
      proposal.info.signatoryMint,
      proposal.pubkey,
      transferAuthority.publicKey,
      mintAuthority,
    ),
  );

  notify({
    message: 'Signing proposal...',
    description: 'Please wait...',
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
      message: 'Proposal signed.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
