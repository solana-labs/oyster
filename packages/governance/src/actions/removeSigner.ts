import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, models, ParsedAccount } from '@oyster/common';

import { GOVERNANCE_PROGRAM_SEED, Proposal } from '../models/governance';
import { removeSignerInstruction } from '../models/removeSigner';
const { sendTransaction } = contexts.Connection;
const { notify } = utils;
const { approve } = models;

export const removeSigner = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
  adminAccount: PublicKey,
  sigAccount: PublicKey,
) => {
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const [mintAuthority] = await PublicKey.findProgramAddress(
    [Buffer.from(GOVERNANCE_PROGRAM_SEED), proposal.pubkey.toBuffer()],
    PROGRAM_IDS.governance.programId,
  );

  const transferAuthority = approve(
    instructions,
    [],
    adminAccount,
    wallet.publicKey,
    1,
  );
  signers.push(transferAuthority);

  instructions.push(
    removeSignerInstruction(
      sigAccount,
      proposal.info.signatoryMint,
      adminAccount,
      proposal.info.adminValidation,
      proposal.pubkey,
      transferAuthority.publicKey,
      mintAuthority,
    ),
  );

  notify({
    message: 'Removing signer...',
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
      message: 'Signer removed.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
