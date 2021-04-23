import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, actions } from '@oyster/common';

import { AccountLayout, MintLayout, Token } from '@solana/spl-token';
import {
  GOVERNANCE_AUTHORITY_SEED,
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

  if (!uninitializedTimelockConfig.program)
    uninitializedTimelockConfig.program = new Account().publicKey; // Random generation if none given

  if (!uninitializedTimelockConfig.councilMint && useCouncil) {
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
      Buffer.from(GOVERNANCE_AUTHORITY_SEED),
      uninitializedTimelockConfig.program.toBuffer(),
    ],
    PROGRAM_IDS.timelock.programId,
  );

  const [programDataAccount] = await PublicKey.findProgramAddress(
    [uninitializedTimelockConfig.program.toBuffer()],
    PROGRAM_IDS.bpf_upgrade_loader,
  );

  instructions.push(
    createEmptyTimelockConfigInstruction(
      timelockConfigKey,
      uninitializedTimelockConfig.program,
      programDataAccount,
      wallet.publicKey,
      uninitializedTimelockConfig.governanceMint,
      wallet.publicKey,
      uninitializedTimelockConfig.councilMint,
    ),
  );
  instructions.push(
    initTimelockConfigInstruction(
      timelockConfigKey,
      uninitializedTimelockConfig.program,
      uninitializedTimelockConfig.governanceMint,

      uninitializedTimelockConfig.voteThreshold!,
      uninitializedTimelockConfig.executionType || ExecutionType.Independent,
      uninitializedTimelockConfig.timelockType ||
        TimelockType.CustomSingleSignerV1,
      uninitializedTimelockConfig.votingEntryRule || VotingEntryRule.Anytime,
      uninitializedTimelockConfig.minimumSlotWaitingPeriod || new BN(0),
      uninitializedTimelockConfig.timeLimit || new BN(0),
      uninitializedTimelockConfig.name || '',
      uninitializedTimelockConfig.councilMint,
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
