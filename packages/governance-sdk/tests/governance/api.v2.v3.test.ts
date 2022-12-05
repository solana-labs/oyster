import { Keypair } from '@solana/web3.js';
import {
  getRealms,
  GoverningTokenConfigAccountArgs,
  GoverningTokenType,
} from '../../src';
import { BenchBuilder } from '../tools/builders';

test('setRealmConfig', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection()
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.sendTx());

  const communityTokenConfig = new GoverningTokenConfigAccountArgs({
    voterWeightAddin: Keypair.generate().publicKey,
    maxVoterWeightAddin: Keypair.generate().publicKey,
    tokenType: GoverningTokenType.Liquid,
  });

  // Act
  await realm.setRealmConfig(communityTokenConfig);

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
    GoverningTokenType.Liquid,
  );
  expect(realmConfig.account.councilTokenConfig.voterWeightAddin).toEqual(
    undefined,
  );
  expect(realmConfig.account.councilTokenConfig.maxVoterWeightAddin).toEqual(
    undefined,
  );
});

test('withdrawGoverningTokens', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection()
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.withCommunityMember())
    .then(b => b.sendTx());

  // Act
  await realm.withdrawGoverningTokens();

  // Assert
  const tokenOwnerRecord = await realm.getTokenOwnerRecord(
    realm.communityOwnerRecordPk,
  );

  expect(
    tokenOwnerRecord.account.governingTokenDepositAmount.toNumber(),
  ).toEqual(0);
});

test('createGovernance', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection()
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.withCommunityMember())
    .then(b => b.sendTx());
  // Act
  const governancePk = await realm.createGovernance();
  // Assert
  const governance = await realm.getGovernance(governancePk);
  expect(governance.account.realm).toEqual(realm.realmPk);
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
});

test('castVote', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection()
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.withCommunityMember())
    .then(b => b.withGovernance())
    .then(b => b.sendTx())
    .then(b => b.withProposal())
    .then(b => b.withProposalSignOff())
    .then(b => b.sendTx());

  // Act
  const voteRecordPk = await realm.castVote();

  // Assert
  const voteRecord = await realm.getVoteRecord(voteRecordPk);

  expect(voteRecord.account.proposal).toEqual(realm.proposalPk);
});

test('relinquishVote', async () => {
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
  await realm.relinquishVote();

  // Assert
  const voteRecord = await realm.getVoteRecord(realm.voteRecordPk);

  expect(voteRecord.account.isRelinquished).toBe(true);
});

test('getRealmsForMultiplePrograms', async () => {
  // Arrange
  const bench = await BenchBuilder.withConnection().then(b => b.withWallet());

  const realm = await bench.withRealm().then(b => b.sendTx());

  // Act

  const realms = await getRealms(bench.connection, [bench.programId]);

  // Assert

  expect(realms.map(r => r.pubkey.toBase58())).toContainEqual(
    realm.realmPk.toBase58(),
  );
});
