import BN from 'bn.js';
import {
  GovernanceConfig,
  VoteThreshold,
  VoteThresholdType,
  VoteTipping,
} from '../../src/governance/accounts';
import { BenchBuilder } from '../tools/builders';
import { getTimestampFromDays } from '../tools/units';

test('createGovernanceWithCouncilThresholds', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection()
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
    maxVotingTime: getTimestampFromDays(3),
    voteTipping: VoteTipping.Strict,
    minCouncilTokensToCreateProposal: new BN(1),
    councilVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: 60,
    }),
    councilVetoVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: 80,
    }),
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
