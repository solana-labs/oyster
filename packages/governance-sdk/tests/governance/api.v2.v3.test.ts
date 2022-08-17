import { BenchBuilder } from '../tools/builders';

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
});

test('castVote', async () => {
  // Arrange
  const realm = await BenchBuilder.withConnection()
    .then(b => b.withWallet())
    .then(b => b.withRealm())
    .then(b => b.withCommunityMember())
    .then(b => b.withGovernance())
    .then(b => b.withProposal())
    .then(b => b.withProposalSignOff())
    .then(b => b.sendTx());

  // Act
  const voteRecordPk = await realm.castVote();

  // Assert
  const voteRecord = await realm.getVoteRecord(voteRecordPk);

  expect(voteRecord.account.proposal).toEqual(realm.proposalPk);
});
