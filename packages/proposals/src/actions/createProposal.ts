import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, actions, ParsedAccount } from '@oyster/common';

import { AccountLayout, MintLayout } from '@solana/spl-token';
import { initTimelockSetInstruction } from '../models/initTimelockSet';
import {
  GOVERNANCE_AUTHORITY_SEED,
  Governance,
  ProposalLayout,
  ProposalStateLayout,
} from '../models/timelock';

const { cache } = contexts.Accounts;
const { sendTransactions } = contexts.Connection;
const { createMint, createTokenAccount } = actions;
const { notify } = utils;

export const createProposal = async (
  connection: Connection,
  wallet: any,
  name: string,
  description: string,
  useGovernance: boolean,
  timelockConfig: ParsedAccount<Governance>,
): Promise<Account> => {
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const sourceMintDecimals = (
    await cache.queryMint(
      connection,
      useGovernance
        ? timelockConfig.info.governanceMint
        : timelockConfig.info.councilMint!,
    )
  ).decimals;

  const timelockSetKey = new Account();

  const {
    sigMint,
    voteMint,
    yesVoteMint,
    noVoteMint,
    adminMint,
    voteValidationAccount,
    sigValidationAccount,
    adminValidationAccount,
    adminDestinationAccount,
    sigDestinationAccount,
    yesVoteDumpAccount,
    noVoteDumpAccount,
    sourceHoldingAccount,
    authority,
    instructions: associatedInstructions,
    signers: associatedSigners,
  } = await getAssociatedAccountsAndInstructions(
    wallet,
    accountRentExempt,
    mintRentExempt,
    timelockConfig,
    useGovernance,
    sourceMintDecimals,
    timelockSetKey,
  );

  let createTimelockAccountsSigners: Account[] = [];
  let createTimelockAccountsInstructions: TransactionInstruction[] = [];

  const timelockRentExempt = await connection.getMinimumBalanceForRentExemption(
    ProposalLayout.span,
  );

  const timelockStateRentExempt = await connection.getMinimumBalanceForRentExemption(
    ProposalStateLayout.span,
  );

  const timelockStateKey = new Account();

  const uninitializedTimelockStateInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: timelockStateKey.publicKey,
    lamports: timelockStateRentExempt,
    space: ProposalStateLayout.span,
    programId: PROGRAM_IDS.timelock.programId,
  });
  signers.push(timelockStateKey);
  createTimelockAccountsSigners.push(timelockStateKey);
  createTimelockAccountsInstructions.push(
    uninitializedTimelockStateInstruction,
  );

  const uninitializedTimelockSetInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: timelockSetKey.publicKey,
    lamports: timelockRentExempt,
    space: ProposalLayout.span,
    programId: PROGRAM_IDS.timelock.programId,
  });
  signers.push(timelockSetKey);
  createTimelockAccountsSigners.push(timelockSetKey);
  createTimelockAccountsInstructions.push(uninitializedTimelockSetInstruction);

  instructions.push(
    initTimelockSetInstruction(
      timelockStateKey.publicKey,
      timelockSetKey.publicKey,
      timelockConfig.pubkey,
      sigMint,
      adminMint,
      voteMint,
      yesVoteMint,
      noVoteMint,
      sigValidationAccount,
      adminValidationAccount,
      voteValidationAccount,
      adminDestinationAccount,
      sigDestinationAccount,
      yesVoteDumpAccount,
      noVoteDumpAccount,
      sourceHoldingAccount,
      useGovernance
        ? timelockConfig.info.governanceMint
        : timelockConfig.info.councilMint!,
      authority,
      description,
      name,
    ),
  );

  notify({
    message: 'Initializing Proposal...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransactions(
      connection,
      wallet,
      [
        ...associatedInstructions,
        createTimelockAccountsInstructions,
        instructions,
      ],
      [...associatedSigners, createTimelockAccountsSigners, signers],
      true,
      true,
    );

    notify({
      message: 'Proposal created.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });

    return timelockSetKey;
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};

interface ValidationReturn {
  sigMint: PublicKey;
  voteMint: PublicKey;
  yesVoteMint: PublicKey;
  noVoteMint: PublicKey;
  adminMint: PublicKey;
  voteValidationAccount: PublicKey;
  sigValidationAccount: PublicKey;
  adminValidationAccount: PublicKey;
  adminDestinationAccount: PublicKey;
  sigDestinationAccount: PublicKey;
  yesVoteDumpAccount: PublicKey;
  noVoteDumpAccount: PublicKey;
  sourceHoldingAccount: PublicKey;
  authority: PublicKey;
  signers: Account[][];
  instructions: TransactionInstruction[][];
}

async function getAssociatedAccountsAndInstructions(
  wallet: any,
  accountRentExempt: number,
  mintRentExempt: number,
  timelockConfig: ParsedAccount<Governance>,
  useGovernance: boolean,
  sourceMintDecimals: number,
  newProposalKey: Account,
): Promise<ValidationReturn> {
  const PROGRAM_IDS = utils.programIds();

  const [authority] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_AUTHORITY_SEED),
      newProposalKey.publicKey.toBuffer(),
    ],
    PROGRAM_IDS.timelock.programId,
  );

  let mintSigners: Account[] = [];
  let mintInstructions: TransactionInstruction[] = [];

  const adminMint = createMint(
    mintInstructions,
    wallet.publicKey,
    mintRentExempt,
    0,
    authority,
    authority,
    mintSigners,
  );

  const sigMint = createMint(
    mintInstructions,
    wallet.publicKey,
    mintRentExempt,
    0,
    authority,
    authority,
    mintSigners,
  );

  let voteMintSigners: Account[] = [];
  let voteMintInstructions: TransactionInstruction[] = [];

  const voteMint = createMint(
    voteMintInstructions,
    wallet.publicKey,
    mintRentExempt,
    sourceMintDecimals,
    authority,
    authority,
    voteMintSigners,
  );

  const yesVoteMint = createMint(
    voteMintInstructions,
    wallet.publicKey,
    mintRentExempt,
    sourceMintDecimals,
    authority,
    authority,
    voteMintSigners,
  );

  const noVoteMint = createMint(
    voteMintInstructions,
    wallet.publicKey,
    mintRentExempt,
    sourceMintDecimals,
    authority,
    authority,
    voteMintSigners,
  );

  let validationSigners: Account[] = [];
  let validationInstructions: TransactionInstruction[] = [];

  const adminValidationAccount = createTokenAccount(
    validationInstructions,
    wallet.publicKey,
    accountRentExempt,
    adminMint,
    authority,
    validationSigners,
  );

  const sigValidationAccount = createTokenAccount(
    validationInstructions,
    wallet.publicKey,
    accountRentExempt,
    sigMint,
    authority,
    validationSigners,
  );

  const voteValidationAccount = createTokenAccount(
    validationInstructions,
    wallet.publicKey,
    accountRentExempt,
    voteMint,
    authority,
    validationSigners,
  );

  let destinationSigners: Account[] = [];
  let destinationInstructions: TransactionInstruction[] = [];

  const adminDestinationAccount = createTokenAccount(
    destinationInstructions,
    wallet.publicKey,
    accountRentExempt,
    adminMint,
    wallet.publicKey,
    destinationSigners,
  );
  const sigDestinationAccount = createTokenAccount(
    destinationInstructions,
    wallet.publicKey,
    accountRentExempt,
    sigMint,
    wallet.publicKey,
    destinationSigners,
  );

  let holdingSigners: Account[] = [];
  let holdingInstructions: TransactionInstruction[] = [];

  const yesVoteDumpAccount = createTokenAccount(
    holdingInstructions,
    wallet.publicKey,
    accountRentExempt,
    yesVoteMint,
    authority,
    holdingSigners,
  );

  const noVoteDumpAccount = createTokenAccount(
    holdingInstructions,
    wallet.publicKey,
    accountRentExempt,
    noVoteMint,
    authority,
    holdingSigners,
  );

  const sourceHoldingAccount = createTokenAccount(
    holdingInstructions,
    wallet.publicKey,
    accountRentExempt,
    useGovernance
      ? timelockConfig.info.governanceMint
      : timelockConfig.info.councilMint!,
    authority,
    holdingSigners,
  );

  return {
    sigMint,
    voteMint,
    adminMint,
    yesVoteMint,
    noVoteMint,
    voteValidationAccount,
    sigValidationAccount,
    adminValidationAccount,
    adminDestinationAccount,
    sigDestinationAccount,
    yesVoteDumpAccount,
    noVoteDumpAccount,
    sourceHoldingAccount,
    authority,
    signers: [
      mintSigners,
      voteMintSigners,
      validationSigners,
      destinationSigners,
      holdingSigners,
    ],
    instructions: [
      mintInstructions,
      voteMintInstructions,
      validationInstructions,
      destinationInstructions,
      holdingInstructions,
    ],
  };
}
