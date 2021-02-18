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

const { sendTransaction } = contexts.Connection;
const { createMint, createTokenAccount, createUninitializedMint } = actions;
const { notify } = utils;

export const createProposal = async (connection: Connection, wallet: any) => {
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const {
    sigMint,
    voteMint,
    adminMint,
    voteValidationAccount,
    sigValidationAccount,
    adminValidationAccount,
    adminDestinationAccount,
    sigDestinationAccount,
    authority,
  } = await createValidationAccountsAndMints(
    connection,
    wallet,
    accountRentExempt,
    mintRentExempt,
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
    programId: PROGRAM_IDS.timelock.programId,
  });

  signers.push(timelockSetKey);
  instructions.push(uninitializedTimelockSetInstruction);

  instructions.push(
    initTimelockSetInstruction(
      timelockSetKey.publicKey,
      sigMint,
      adminMint,
      voteMint,
      sigValidationAccount,
      adminValidationAccount,
      voteValidationAccount,
      adminDestinationAccount,
      sigDestinationAccount,
      authority,
      {
        timelockType: TimelockType.CustomSingleSignerV1,
        consensusAlgorithm: ConsensusAlgorithm.Majority,
        executionType: ExecutionType.AllOrNothing,
      },
      'Testing',
      'Name',
    ),
  );

  notify({
    message: 'Initializing Proposal...',
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
      message: 'Proposal created.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};

interface ValidationReturn {
  sigMint: PublicKey;
  voteMint: PublicKey;
  adminMint: PublicKey;
  voteValidationAccount: PublicKey;
  sigValidationAccount: PublicKey;
  adminValidationAccount: PublicKey;
  adminDestinationAccount: PublicKey;
  sigDestinationAccount: PublicKey;
  authority: PublicKey;
}
async function createValidationAccountsAndMints(
  connection: Connection,
  wallet: any,
  accountRentExempt: number,
  mintRentExempt: number,
): Promise<ValidationReturn> {
  const PROGRAM_IDS = utils.programIds();
  notify({
    message: `Creating mints...`,
    type: 'warn',
    description: `Please wait...`,
  });

  const [authority] = await PublicKey.findProgramAddress(
    [PROGRAM_IDS.timelock.programAccountId.toBuffer()],
    PROGRAM_IDS.timelock.programId,
  );

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const adminMint = createMint(
    instructions,
    wallet.publicKey,
    mintRentExempt,
    0,
    authority,
    authority,
    signers,
  );

  const sigMint = createMint(
    instructions,
    wallet.publicKey,
    mintRentExempt,
    0,
    authority,
    authority,
    signers,
  );

  const voteMint = createMint(
    instructions,
    wallet.publicKey,
    mintRentExempt,
    0,
    authority,
    authority,
    signers,
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
      message: `Mints created.`,
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }

  notify({
    message: `Creating validation accounts...`,
    type: 'warn',
    description: `Please wait...`,
  });

  signers = [];
  instructions = [];

  const adminValidationAccount = createTokenAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    adminMint,
    PROGRAM_IDS.timelock.programAccountId,
    signers,
  );

  const sigValidationAccount = createTokenAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    sigMint,
    PROGRAM_IDS.timelock.programAccountId,
    signers,
  );

  const voteValidationAccount = createTokenAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    voteMint,
    PROGRAM_IDS.timelock.programAccountId,
    signers,
  );

  const adminDestinationAccount = createTokenAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    adminMint,
    wallet.publicKey,
    signers,
  );
  const sigDestinationAccount = createTokenAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    sigMint,
    wallet.publicKey,
    signers,
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
      message: `Admin and signatory accounts created.`,
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }

  return {
    sigMint,
    voteMint,
    adminMint,
    voteValidationAccount,
    sigValidationAccount,
    adminValidationAccount,
    adminDestinationAccount,
    sigDestinationAccount,
    authority,
  };
}
