import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, actions } from '@oyster/common';

import { AccountLayout, MintLayout, Token } from '@solana/spl-token';
import {
  ConsensusAlgorithm,
  ExecutionType,
  TimelockConfig,
  TimelockType,
  VotingEntryRule,
} from '../models/timelock';
import { initTimelockConfigInstruction } from '../models/initTimelockConfig';
import BN from 'bn.js';
import { createEmptyTimelockConfigInstruction } from '../models/createEmptyTimelockConfig';

const { sendTransactions } = contexts.Connection;
const { createMint, createTokenAccount } = actions;
const { notify } = utils;

export const registerProgramGovernance = async (
  connection: Connection,
  wallet: any,
  uninitializedTimelockConfig: Partial<TimelockConfig>,
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

  if (!uninitializedTimelockConfig.program)
    uninitializedTimelockConfig.program = new Account().publicKey; // Random generation if none given

  if (!uninitializedTimelockConfig.councilMint) {
    // Initialize the mint, an account for the admin, and give them one council token
    // to start their lives with.
    uninitializedTimelockConfig.councilMint = createMint(
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
      uninitializedTimelockConfig.councilMint,
      wallet.publicKey,
      mintSigners,
    );

    mintInstructions.push(
      Token.createMintToInstruction(
        PROGRAM_IDS.token,
        uninitializedTimelockConfig.councilMint,
        adminsCouncilToken,
        wallet.publicKey,
        [],
        1,
      ),
    );
  }

  if (!uninitializedTimelockConfig.governanceMint) {
    // Initialize the mint, an account for the admin, and give them one governance token
    // to start their lives with.
    uninitializedTimelockConfig.governanceMint = createMint(
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
      uninitializedTimelockConfig.governanceMint,
      wallet.publicKey,
      mintSigners,
    );

    mintInstructions.push(
      Token.createMintToInstruction(
        PROGRAM_IDS.token,
        uninitializedTimelockConfig.governanceMint,
        adminsGovernanceToken,
        wallet.publicKey,
        [],
        1,
      ),
    );
  }

  const [timelockConfigKey] = await PublicKey.findProgramAddress(
    [
      PROGRAM_IDS.timelock.programAccountId.toBuffer(),
      uninitializedTimelockConfig.governanceMint.toBuffer(),
      uninitializedTimelockConfig.councilMint.toBuffer(),
      uninitializedTimelockConfig.program.toBuffer(),
    ],
    PROGRAM_IDS.timelock.programId,
  );

  instructions.push(
    createEmptyTimelockConfigInstruction(
      timelockConfigKey,
      uninitializedTimelockConfig.program,
      uninitializedTimelockConfig.governanceMint,
      uninitializedTimelockConfig.councilMint,
      wallet.publicKey,
    ),
  );
  instructions.push(
    initTimelockConfigInstruction(
      timelockConfigKey,
      uninitializedTimelockConfig.program,
      uninitializedTimelockConfig.governanceMint,
      uninitializedTimelockConfig.councilMint,
      uninitializedTimelockConfig.consensusAlgorithm ||
        ConsensusAlgorithm.Majority,
      uninitializedTimelockConfig.executionType || ExecutionType.Independent,
      uninitializedTimelockConfig.timelockType ||
        TimelockType.CustomSingleSignerV1,
      uninitializedTimelockConfig.votingEntryRule || VotingEntryRule.Anytime,
      uninitializedTimelockConfig.minimumSlotWaitingPeriod || new BN(0),
      uninitializedTimelockConfig.timeLimit || new BN(0),
      uninitializedTimelockConfig.name || '',
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
      true,
    );

    notify({
      message: 'Program is now governed.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });

    return timelockConfigKey;
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
