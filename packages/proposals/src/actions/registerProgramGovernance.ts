import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, actions, models } from '@oyster/common';

import { AccountLayout, MintLayout, Token } from '@solana/spl-token';
import {
  ConsensusAlgorithm,
  ExecutionType,
  TimelockConfig,
  TimelockConfigLayout,
  TimelockType,
  VotingEntryRule,
} from '../models/timelock';
import { initTimelockConfigInstruction } from '../models/initTimelockConfig';
import BN from 'bn.js';
import { createEmptyTimelockConfigInstruction } from '../models/createEmptyTimelockConfig';

const { sendTransaction } = contexts.Connection;
const { createMint, createTokenAccount } = actions;
const { notify } = utils;
const { approve } = models;

export const registerProgramGovernance = async (
  connection: Connection,
  wallet: any,
  uninitializedTimelockConfig: Partial<TimelockConfig>,
): Promise<PublicKey> => {
  const PROGRAM_IDS = utils.programIds();
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  if (!uninitializedTimelockConfig.program)
    uninitializedTimelockConfig.program = new Account().publicKey; // Random generation if none given

  if (!uninitializedTimelockConfig.governanceMint) {
    // Initialize the mint, an account for the admin, and give them one governance token
    // to start their lives with.
    uninitializedTimelockConfig.governanceMint = createMint(
      instructions,
      wallet.publicKey,
      mintRentExempt,
      0,
      wallet.publicKey,
      wallet.publicKey,
      signers,
    );

    const adminsGovernanceToken = createTokenAccount(
      instructions,
      wallet.publicKey,
      accountRentExempt,
      uninitializedTimelockConfig.governanceMint,
      wallet.publicKey,
      signers,
    );

    instructions.push(
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

  const timelockRentExempt = await connection.getMinimumBalanceForRentExemption(
    TimelockConfigLayout.span,
  );
  const [timelockConfigKey] = await PublicKey.findProgramAddress(
    [
      PROGRAM_IDS.timelock.programAccountId.toBuffer(),
      uninitializedTimelockConfig.governanceMint.toBuffer(),
      uninitializedTimelockConfig.program.toBuffer(),
    ],
    PROGRAM_IDS.timelock.programId,
  );

  instructions.push(
    createEmptyTimelockConfigInstruction(
      timelockConfigKey,
      uninitializedTimelockConfig.program,
      uninitializedTimelockConfig.governanceMint,
      wallet.publicKey,
    ),
  );
  instructions.push(
    initTimelockConfigInstruction(
      timelockConfigKey,
      uninitializedTimelockConfig.program,
      uninitializedTimelockConfig.governanceMint,
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
    let tx = await sendTransaction(
      connection,
      wallet,
      instructions,
      signers,
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
