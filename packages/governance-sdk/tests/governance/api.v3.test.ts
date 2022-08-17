import { Keypair } from '@solana/web3.js';
import BN from 'bn.js';
import {
  GovernanceConfig,
  GoverningTokenConfigAccountArgs,
  GoverningTokenType,
  VoteThreshold,
  VoteThresholdType,
  VoteTipping,
} from '../../src/governance/accounts';
import { PROGRAM_VERSION_V3 } from '../../src/registry/constants';
import { BenchBuilder } from '../tools/builders';
import { getTimestampFromDays } from '../tools/units';

test('createRealmWithTokenConfigs', async () => {
  // Arrange
  const bench = await BenchBuilder.withConnection().then(b => b.withWallet());

  const communityTokenConfig = new GoverningTokenConfigAccountArgs({
    voterWeightAddin: Keypair.generate().publicKey,
    maxVoterWeightAddin: Keypair.generate().publicKey,
    tokenType: GoverningTokenType.Dormant,
  });
  const councilTokenConfig = new GoverningTokenConfigAccountArgs({
    voterWeightAddin: Keypair.generate().publicKey,
    maxVoterWeightAddin: Keypair.generate().publicKey,
    tokenType: GoverningTokenType.Membership,
  });

  // Act
  const realm = await bench
    .withRealm(communityTokenConfig, councilTokenConfig)
    .then(b => b.sendTx());

  // Assert
  const realmConfig = await realm.getRealmConfig();

  expect(realmConfig.account.realm).toEqual(realm.realmPk);

  // communityTokenConfig
  expect(realmConfig.account.communityTokenConfig.tokenType).toEqual(
    communityTokenConfig.tokenType,
  );
  expect(realmConfig.account.communityTokenConfig.voterWeightAddin).toEqual(
    communityTokenConfig.voterWeightAddin,
  );
  expect(realmConfig.account.communityTokenConfig.maxVoterWeightAddin).toEqual(
    communityTokenConfig.maxVoterWeightAddin,
  );

  // councilTokenConfig
  expect(realmConfig.account.councilTokenConfig.tokenType).toEqual(
    GoverningTokenType.Membership,
  );
  expect(realmConfig.account.councilTokenConfig.voterWeightAddin).toEqual(
    councilTokenConfig.voterWeightAddin,
  );
  expect(realmConfig.account.councilTokenConfig.maxVoterWeightAddin).toEqual(
    councilTokenConfig.maxVoterWeightAddin,
  );
});

test('createGovernanceWithCouncilThresholds', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection(PROGRAM_VERSION_V3)
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

test('setRealmConfigWithTokenConfigs', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection()
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.sendTx());

  const communityTokenConfig = new GoverningTokenConfigAccountArgs({
    voterWeightAddin: Keypair.generate().publicKey,
    maxVoterWeightAddin: Keypair.generate().publicKey,
    tokenType: GoverningTokenType.Dormant,
  });
  const councilTokenConfig = new GoverningTokenConfigAccountArgs({
    voterWeightAddin: Keypair.generate().publicKey,
    maxVoterWeightAddin: Keypair.generate().publicKey,
    tokenType: GoverningTokenType.Membership,
  });

  // Act
  await realm.setRealmConfig(communityTokenConfig, councilTokenConfig);

  // Assert
  const realmConfig = await realm.getRealmConfig();

  expect(realmConfig.account.realm).toEqual(realm.realmPk);

  // communityTokenConfig
  expect(realmConfig.account.communityTokenConfig.tokenType).toEqual(
    communityTokenConfig.tokenType,
  );
  expect(realmConfig.account.communityTokenConfig.voterWeightAddin).toEqual(
    communityTokenConfig.voterWeightAddin,
  );
  expect(realmConfig.account.communityTokenConfig.maxVoterWeightAddin).toEqual(
    communityTokenConfig.maxVoterWeightAddin,
  );

  // councilTokenConfig
  expect(realmConfig.account.councilTokenConfig.tokenType).toEqual(
    GoverningTokenType.Membership,
  );
  expect(realmConfig.account.councilTokenConfig.voterWeightAddin).toEqual(
    councilTokenConfig.voterWeightAddin,
  );
  expect(realmConfig.account.councilTokenConfig.maxVoterWeightAddin).toEqual(
    councilTokenConfig.maxVoterWeightAddin,
  );
});
