import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, actions } from '@oyster/common';

import { AccountLayout, MintLayout } from '@solana/spl-token';
import { initTimelockSetInstruction } from '../models/initTimelockSet';
import {
  ConsensusAlgorithm,
  ExecutionType,
  TimelockSetLayout,
  TimelockType,
} from '../models/timelock';
import { addSignatoryMintInstruction } from '../models/addSignatoryMint';
import { addVotingMintInstruction } from '../models/addVotingMint';
import { createSign } from 'crypto';

const { sendTransaction } = contexts.Connection;
const { createUninitializedMint } = actions;
const { notify } = utils;

export const createProposal = async (connection: Connection, wallet: any) => {
  notify({
    message: 'Initializing Proposal...',
    description: 'Please wait...',
    type: 'warn',
  });
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const timelockRentExempt = await connection.getMinimumBalanceForRentExemption(
    TimelockSetLayout.span,
  );
  const timelockSetKey = new Account();

  const uninitializedTimelockSetInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: timelockSetKey.publicKey,
    lamports: timelockRentExempt,
    space: TimelockSetLayout.span,
    programId: PROGRAM_IDS.timelock.programAccountId,
  });

  signers.push(timelockSetKey);
  instructions.push(uninitializedTimelockSetInstruction);

  const adminMint = createUninitializedMint(
    instructions,
    wallet.publicKey,
    mintRentExempt,
    signers,
  );

  const adminValidationKey = new Account();
  const adminValidationInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: adminValidationKey.publicKey,
    lamports: mintRentExempt,
    space: MintLayout.span,
    programId: PROGRAM_IDS.timelock.programAccountId,
  });
  instructions.push(adminValidationInstruction);
  signers.push(adminValidationKey);

  const destinationAdminKey = new Account();
  const destinationAdminInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: destinationAdminKey.publicKey,
    lamports: accountRentExempt,
    space: AccountLayout.span,
    programId: wallet.publicKey,
  });
  instructions.push(destinationAdminInstruction);
  signers.push(destinationAdminKey);

  instructions.push(
    initTimelockSetInstruction(
      timelockSetKey.publicKey,
      adminMint,
      adminValidationKey.publicKey,
      destinationAdminKey.publicKey,
      wallet.publicKey,
      {
        timelockType: TimelockType.CustomSingleSignerV1,
        consensusAlgorithm: ConsensusAlgorithm.Majority,
        executionType: ExecutionType.AllOrNothing,
      },
    ),
  );

  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      instructions,
      signers,
      true,
    );

    notify({
      message: 'Proposal created.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
  /*await createSignatoryMint({
    connection,
    wallet,
    mintRentExempt,
    timelockSetKey,
    destinationAdminKey,
    adminMint,
    accountRentExempt,
  });

  await createVotingMint({
    connection,
    wallet,
    mintRentExempt,
    timelockSetKey,
    destinationAdminKey,
    adminMint,
    accountRentExempt,
  });*/
};

interface MintParams {
  connection: Connection;
  wallet: any;
  mintRentExempt: number;
  timelockSetKey: Account;
  destinationAdminKey: Account;
  adminMint: PublicKey;
  accountRentExempt: number;
}

async function createSignatoryMint(args: MintParams) {
  const {
    connection,
    wallet,
    mintRentExempt,
    timelockSetKey,
    destinationAdminKey,
    adminMint,
    accountRentExempt,
  } = args;

  const PROGRAM_IDS = utils.programIds();
  let signatoryInstructions: TransactionInstruction[] = [];
  let signatorySigners: Account[] = [];
  const signatoryMint = createUninitializedMint(
    signatoryInstructions,
    wallet.publicKey,
    mintRentExempt,
    signatorySigners,
  );

  const signatoryValidationKey = new Account();
  const signatoryValidationInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: signatoryValidationKey.publicKey,
    lamports: mintRentExempt,
    space: MintLayout.span,
    programId: PROGRAM_IDS.timelock.programAccountId,
  });
  signatoryInstructions.push(signatoryValidationInstruction);
  signatorySigners.push(signatoryValidationKey);

  const destinationSignatoryKey = new Account();
  const destinationSignatoryInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: destinationSignatoryKey.publicKey,
    lamports: accountRentExempt,
    space: AccountLayout.span,
    programId: wallet.publicKey,
  });
  signatoryInstructions.push(destinationSignatoryInstruction);
  signatorySigners.push(destinationSignatoryKey);

  signatoryInstructions.push(
    addSignatoryMintInstruction(
      timelockSetKey.publicKey,
      destinationAdminKey.publicKey,
      adminMint,
      signatoryMint,
      signatoryValidationKey.publicKey,
      destinationSignatoryKey.publicKey,
    ),
  );

  notify({
    message: 'Adding you as a Signatory...',
    type: 'warn',
    description: 'Please wait...',
  });

  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      signatoryInstructions,
      signatorySigners,
      true,
    );

    notify({
      message: 'Signatory added!',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
}

async function createVotingMint(args: MintParams) {
  const {
    connection,
    wallet,
    mintRentExempt,
    timelockSetKey,
    destinationAdminKey,
    adminMint,
  } = args;

  const PROGRAM_IDS = utils.programIds();
  let votingInstructions: TransactionInstruction[] = [];
  let votingSigners: Account[] = [];

  const votingMint = createUninitializedMint(
    votingInstructions,
    wallet.publicKey,
    mintRentExempt,
    votingSigners,
  );

  const votingValidationKey = new Account();
  const votingValidationInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: votingValidationKey.publicKey,
    lamports: mintRentExempt,
    space: MintLayout.span,
    programId: PROGRAM_IDS.timelock.programAccountId,
  });
  votingInstructions.push(votingValidationInstruction);
  votingSigners.push(votingValidationKey);

  votingInstructions.push(
    addVotingMintInstruction(
      timelockSetKey.publicKey,
      destinationAdminKey.publicKey,
      adminMint,
      votingMint,
      votingValidationKey.publicKey,
    ),
  );

  notify({
    message: 'Adding Voting Mint...',
    type: 'warn',
    description: 'Please wait...',
  });

  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      votingInstructions,
      votingSigners,
      true,
    );

    notify({
      message: 'Voting Mint added!',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
}
