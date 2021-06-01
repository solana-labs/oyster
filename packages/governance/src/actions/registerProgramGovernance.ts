import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, actions, SequenceType } from '@oyster/common';

import { AccountLayout, MintLayout, Token } from '@solana/spl-token';
import { GOVERNANCE_PROGRAM_SEED, Governance } from '../models/governance';
import { createGovernanceInstruction } from '../models/createGovernance';
import BN from 'bn.js';

const { sendTransactions } = contexts.Connection;
const { createMint, createTokenAccount } = actions;
const { notify } = utils;

export const registerProgramGovernance = async (
  connection: Connection,
  wallet: any,
  uninitializedGovernance: Partial<Governance>,
  useCouncil: boolean,
): Promise<PublicKey> => {
  const PROGRAM_IDS = utils.programIds();
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];
  let mintSigners: Account[] = [];
  let mintInstructions: TransactionInstruction[] = [];

  const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  if (!uninitializedGovernance.program)
    uninitializedGovernance.program = new Account().publicKey; // Random generation if none given

  if (!uninitializedGovernance.councilMint && useCouncil) {
    // Initialize the mint, an account for the admin, and give them one council token
    // to start their lives with.
    uninitializedGovernance.councilMint = createMint(
      mintInstructions,
      wallet.publicKey,
      mintRentExempt,
      0,
      wallet.publicKey,
      wallet.publicKey,
      mintSigners,
    );

    const adminsCouncilToken = createTokenAccount(
      mintInstructions,
      wallet.publicKey,
      accountRentExempt,
      uninitializedGovernance.councilMint,
      wallet.publicKey,
      mintSigners,
    );

    mintInstructions.push(
      Token.createMintToInstruction(
        PROGRAM_IDS.token,
        uninitializedGovernance.councilMint,
        adminsCouncilToken,
        wallet.publicKey,
        [],
        1,
      ),
    );
  }

  if (!uninitializedGovernance.governanceMint) {
    // Initialize the mint, an account for the admin, and give them one governance token
    // to start their lives with.
    uninitializedGovernance.governanceMint = createMint(
      mintInstructions,
      wallet.publicKey,
      mintRentExempt,
      0,
      wallet.publicKey,
      wallet.publicKey,
      mintSigners,
    );

    const adminsGovernanceToken = createTokenAccount(
      mintInstructions,
      wallet.publicKey,
      accountRentExempt,
      uninitializedGovernance.governanceMint,
      wallet.publicKey,
      mintSigners,
    );

    mintInstructions.push(
      Token.createMintToInstruction(
        PROGRAM_IDS.token,
        uninitializedGovernance.governanceMint,
        adminsGovernanceToken,
        wallet.publicKey,
        [],
        1,
      ),
    );
  }

  const [governanceKey] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      uninitializedGovernance.program.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
  );

  const [programDataAccount] = await PublicKey.findProgramAddress(
    [uninitializedGovernance.program.toBuffer()],
    PROGRAM_IDS.bpf_upgrade_loader,
  );

  instructions.push(
    createGovernanceInstruction(
      governanceKey,
      uninitializedGovernance.program,
      programDataAccount,
      wallet.publicKey,
      uninitializedGovernance.governanceMint,

      uninitializedGovernance.voteThreshold!,
      uninitializedGovernance.minimumSlotWaitingPeriod || new BN(0),
      uninitializedGovernance.timeLimit || new BN(0),
      uninitializedGovernance.name || '',
      wallet.publicKey,
      uninitializedGovernance.councilMint,
    ),
  );

  notify({
    message: 'Initializing governance of program...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransactions(
      connection,
      wallet,
      mintInstructions.length
        ? [mintInstructions, instructions]
        : [instructions],
      mintInstructions.length ? [mintSigners, signers] : [signers],
      SequenceType.Sequential,
    );

    notify({
      message: 'Program is now governed.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });

    return governanceKey;
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
