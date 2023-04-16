import BN from 'bn.js';
import { PROGRAM_VERSION_V2 } from '../../src';
import {
  GovernanceConfig,
  VoteThreshold,
  VoteThresholdType,
  VoteTipping,
} from '../../src/governance/accounts';
import { BenchBuilder } from '../tools/builders';
import { getTimestampFromDays } from '../tools/units';

test('createGovernanceWithConfig', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection(PROGRAM_VERSION_V2)
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.withCommunityMember())
    .then(b => b.sendTx());

  const config = new GovernanceConfig({
    communityVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: 20,
    }),
    minCommunityTokensToCreateProposal: new BN(1),
    minInstructionHoldUpTime: 0,
    baseVotingTime: getTimestampFromDays(3),
    communityVoteTipping: VoteTipping.Strict,
    councilVoteTipping: VoteTipping.Strict,
    minCouncilTokensToCreateProposal: new BN(1),
    councilVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: 0,
    }),
    councilVetoVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: 0,
    }),
    communityVetoVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: 0,
    }),
    votingCoolOffTime: 0,
    depositExemptProposalCount: 0,
  });

  // Act
  const governancePk = await realm.createGovernance(config);

  // Assert
  const governance = await realm.getGovernance(governancePk);

  expect(governance.account.config.communityVoteThreshold).toEqual(
    config.communityVoteThreshold,
  );

  expect(governance.account.config.councilVoteThreshold).toEqual(
    config.councilVoteThreshold,
  );

  expect(governance.account.config.councilVetoVoteThreshold).toEqual(
    config.councilVetoVoteThreshold,
  );
});
