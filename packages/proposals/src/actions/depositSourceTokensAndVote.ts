import { Connection, PublicKey } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { TimelockConfig, TimelockSet, TimelockState } from '../models/timelock';

import { vote } from './vote';
import { depositSourceTokens } from './depositSourceTokens';

export const depositSourceTokensAndVote = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<TimelockSet>,
  existingVoteAccount: PublicKey | undefined,
  existingYesVoteAccount: PublicKey | undefined,
  existingNoVoteAccount: PublicKey | undefined,
  sourceAccount: PublicKey,
  timelockConfig: ParsedAccount<TimelockConfig>,
  state: ParsedAccount<TimelockState>,
  yesVotingTokenAmount: number,
  noVotingTokenAmount: number,
) => {
  const votingTokenAmount =
    yesVotingTokenAmount > 0 ? yesVotingTokenAmount : noVotingTokenAmount;

  const {
    voteAccount,
    yesVoteAccount,
    noVoteAccount,
  } = await depositSourceTokens(
    connection,
    wallet,
    proposal,
    existingVoteAccount,
    existingYesVoteAccount,
    existingNoVoteAccount,
    sourceAccount,
    votingTokenAmount,
  );

  await vote(
    connection,
    wallet,
    proposal,
    timelockConfig,
    state,
    voteAccount,
    yesVoteAccount,
    noVoteAccount,
    yesVotingTokenAmount,
    noVotingTokenAmount,
  );
};
