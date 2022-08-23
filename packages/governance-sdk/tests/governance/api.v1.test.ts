import { PROGRAM_VERSION_V1 } from '../../src';

import { BenchBuilder } from '../tools/builders';

test('createRealm', async () => {
  // Arrange
  const bench = await BenchBuilder.withConnection(PROGRAM_VERSION_V1).then(b =>
    b.withWallet(),
  );

  // Act
  const realm = await bench.withRealm().then(b => b.sendTx());

  // Assert
  const realmAccount = await realm.getRealm();

  expect(realmAccount.pubkey).toEqual(realm.realmPk);
});

test('createGovernance', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection(PROGRAM_VERSION_V1)
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
  const realm = await BenchBuilder.withConnection(PROGRAM_VERSION_V1)
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.withCommunityMember())
    .then(b => b.withGovernance())
    .then(b => b.sendTx());

  // Act
  const proposalPk = await realm.createProposal('proposal 1');

  // // Assert
  const proposal = await realm.getProposal(proposalPk);

  expect(proposal.account.name).toEqual('proposal 1');
});

test('castVote', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection(PROGRAM_VERSION_V1)
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.withCommunityMember())
    .then(b => b.withGovernance())
    .then(b => b.sendTx())
    .then(b => b.withProposal())
    .then(b => b.withSignatory())
    .then(b => b.withProposalSignOff())
    .then(b => b.sendTx());

  // Act
  const voteRecordPk = await realm.castVote();

  // Assert
  const voteRecord = await realm.getVoteRecord(voteRecordPk);

  expect(voteRecord.account.proposal).toEqual(realm.proposalPk);
});
