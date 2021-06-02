import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, actions, ParsedAccount } from '@oyster/common';

import { AccountLayout, MintLayout } from '@solana/spl-token';
import { initProposalInstruction } from '../models/initProposal';
import {
  GovernanceOld,
  ProposalLayout,
  ProposalStateLayout,
} from '../models/serialisation';
import { GOVERNANCE_PROGRAM_SEED } from '../models/accounts';

const { cache } = contexts.Accounts;
const { sendTransactions } = contexts.Connection;
const { createMint, createTokenAccount } = actions;
const { notify } = utils;

export const createProposalOld = async (
  connection: Connection,
  wallet: any,
  name: string,
  description: string,
  useGovernance: boolean,
  governance: ParsedAccount<GovernanceOld>,
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
        ? governance.info.governanceMint
        : governance.info.councilMint!,
    )
  ).decimals;

  const proposalKey = new Account();

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
    sourceHoldingAccount,
    authority,
    instructions: associatedInstructions,
    signers: associatedSigners,
  } = await getAssociatedAccountsAndInstructions(
    wallet,
    accountRentExempt,
    mintRentExempt,
    governance,
    useGovernance,
    sourceMintDecimals,
    proposalKey,
  );

  let createGovernanceAccountsSigners: Account[] = [];
  let createGovernanceAccountsInstructions: TransactionInstruction[] = [];

  const proposalRentExempt = await connection.getMinimumBalanceForRentExemption(
    ProposalLayout.span,
  );

  const proposalStateRentExempt = await connection.getMinimumBalanceForRentExemption(
    ProposalStateLayout.span,
  );

  const proposalStateKey = new Account();

  const uninitializedProposalStateInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: proposalStateKey.publicKey,
    lamports: proposalStateRentExempt,
    space: ProposalStateLayout.span,
    programId: PROGRAM_IDS.governance.programId,
  });
  signers.push(proposalStateKey);
  createGovernanceAccountsSigners.push(proposalStateKey);
  createGovernanceAccountsInstructions.push(
    uninitializedProposalStateInstruction,
  );

  const uninitializedProposalInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: proposalKey.publicKey,
    lamports: proposalRentExempt,
    space: ProposalLayout.span,
    programId: PROGRAM_IDS.governance.programId,
  });
  signers.push(proposalKey);
  createGovernanceAccountsSigners.push(proposalKey);
  createGovernanceAccountsInstructions.push(uninitializedProposalInstruction);

  instructions.push(
    initProposalInstruction(
      proposalStateKey.publicKey,
      proposalKey.publicKey,
      governance.pubkey,
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
      sourceHoldingAccount,
      useGovernance
        ? governance.info.governanceMint
        : governance.info.councilMint!,
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
        createGovernanceAccountsInstructions,
        instructions,
      ],
      [...associatedSigners, createGovernanceAccountsSigners, signers],
    );

    notify({
      message: 'Proposal created.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });

    return proposalKey;
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
  sourceHoldingAccount: PublicKey;
  authority: PublicKey;
  signers: Account[][];
  instructions: TransactionInstruction[][];
}

async function getAssociatedAccountsAndInstructions(
  wallet: any,
  accountRentExempt: number,
  mintRentExempt: number,
  governance: ParsedAccount<GovernanceOld>,
  useGovernance: boolean,
  sourceMintDecimals: number,
  newProposalKey: Account,
): Promise<ValidationReturn> {
  const PROGRAM_IDS = utils.programIds();

  const [authority] = await PublicKey.findProgramAddress(
    [Buffer.from(GOVERNANCE_PROGRAM_SEED), newProposalKey.publicKey.toBuffer()],
    PROGRAM_IDS.governance.programId,
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

  const sourceHoldingAccount = createTokenAccount(
    holdingInstructions,
    wallet.publicKey,
    accountRentExempt,
    useGovernance
      ? governance.info.governanceMint
      : governance.info.councilMint!,
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
