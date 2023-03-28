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

test('getGovernanceProgramVersion', async () => {
  // Arrange
  // Act
  const builder = await BenchBuilder.withConnection();

  // Assert
  expect(builder.programVersion).toEqual(3);
});

test('createRealmWithTokenConfigs', async () => {
  // Arrange
  const bench = await BenchBuilder.withConnection(PROGRAM_VERSION_V3).then(b =>
    b.withWallet(),
  );

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

test('createGovernanceWithConfig', async () => {
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
    baseVotingTime: getTimestampFromDays(3),
    communityVoteTipping: VoteTipping.Strict,
    councilVoteTipping: VoteTipping.Strict,
    minCouncilTokensToCreateProposal: new BN(1),
    councilVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: 60,
    }),
    councilVetoVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: 80,
    }),
    communityVetoVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: 80,
    }),
    votingCoolOffTime: 5000,
    depositExemptProposalCount: 10,
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

  expect(governance.account.config.baseVotingTime).toEqual(
    getTimestampFromDays(3),
  );

  expect(governance.account.config.votingCoolOffTime).toEqual(5000);

  expect(governance.account.config.depositExemptProposalCount).toEqual(10);
});

test('setRealmConfigWithTokenConfigs', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection(PROGRAM_VERSION_V3)
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

test('revokeGoverningToken', async () => {
  // Arrange

  const communityTokenConfig = new GoverningTokenConfigAccountArgs({
    voterWeightAddin: undefined,
    maxVoterWeightAddin: undefined,
    tokenType: GoverningTokenType.Membership,
  });

  const realm = await BenchBuilder.withConnection(PROGRAM_VERSION_V3)
    .then(b => b.withWallet())
    .then(b => b.withRealm(communityTokenConfig))
    .then(b => b.withCommunityMember())
    .then(b => b.sendTx());

  // Act
  await realm.revokeGoverningTokens();

  // Assert
  const tokenOwnerRecord = await realm.getTokenOwnerRecord(
    realm.communityOwnerRecordPk,
  );

  expect(
    tokenOwnerRecord.account.governingTokenDepositAmount.toNumber(),
  ).toEqual(0);
});

test('createProposal', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection()
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.withCommunityMember())
    .then(b => b.withGovernance())
    .then(b => b.sendTx());

  // Act
  const proposalPk = await realm.createProposal('proposal 1');

  // Assert
  const proposal = await realm.getProposal(proposalPk);

  expect(proposal.account.name).toEqual('proposal 1');
  expect(proposal.account.vetoVoteWeight.toNumber()).toEqual(0);

  const governance = await realm.getGovernance(proposal.account.governance);
  expect(governance.account.activeProposalCount.toNumber()).toEqual(1);
});

test('createProposalWithDeposit', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection()
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.withCommunityMember())
    .then(b => b.withGovernance())
    .then(b => b.sendTx());

  // Act
  const proposalPk = await realm.createProposal('proposal 1');

  // Assert
  const proposalDeposit = (
    await realm.getProposalDeposits(realm.bench.walletPk)
  )[0];

  expect(proposalDeposit.account.proposal).toEqual(proposalPk);
  expect(proposalDeposit.account.depositPayer).toEqual(realm.bench.walletPk);
});

test('refundProposalDeposit', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection()
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.withCommunityMember())
    .then(b => b.withGovernance())
    .then(b => b.sendTx())
    .then(b => b.withProposal())
    .then(b => b.withProposalSignOff())
    .then(b => b.withCastVote())
    .then(b => b.sendTx());

  // Act
  await realm.refundProposalDeposit();

  // Assert
  const proposalDeposits = await realm.getProposalDeposits(
    realm.bench.walletPk,
  );

  expect(proposalDeposits.length).toBe(0);
});
