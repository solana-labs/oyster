import { Button, Card, Col, Row, Spin } from 'antd';
import React from 'react';
import { GUTTER, LABELS } from '../../constants';
import { contexts, hooks, ParsedAccount } from '@oyster/common';
import './style.less';
import { createProposal } from '../../actions/createProposal';
import { useProposals } from '../../contexts/proposals';
import {
  ConsensusAlgorithm,
  ExecutionType,
  TimelockSet,
  TimelockType,
} from '../../models/timelock';
import { Connection } from '@solana/web3.js';
import { addCustomSingleSignerTransaction } from '../../actions/addCustomSingleSignerTransaction';
const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

export const DashboardView = () => {
  const wallet = useWallet();
  const connection = useConnection();
  const context = useProposals();
  const proposal = Object.keys(context.proposals).length
    ? context.proposals[Object.keys(context.proposals)[0]]
    : null;

  return (
    <div className="dashboard-container">
      <Row gutter={GUTTER} className="home-info-row">
        <Button
          onClick={() =>
            createProposal(
              connection,
              wallet.wallet,
              'Billy',
              'https://gist.github.com/dummytester123/bd3567f80e13a27b02a2e0fb891ecab1',
              TimelockType.CustomSingleSignerV1,
              ConsensusAlgorithm.Majority,
              ExecutionType.AnyAboveVoteFinishSlot,
            )
          }
        >
          Add Proposal
        </Button>
      </Row>
      {proposal && wallet.wallet && connection && (
        <InnerDummyView
          proposal={proposal}
          connection={connection}
          wallet={wallet.wallet}
        />
      )}
    </div>
  );
};

function InnerDummyView({
  proposal,
  connection,
  wallet,
}: {
  connection: Connection;
  wallet: contexts.Wallet.WalletAdapter;
  proposal: ParsedAccount<TimelockSet>;
}) {
  const sigAccount = useAccountByMint(proposal.info.signatoryMint);
  if (!sigAccount) return <Spin />;
  return (
    <Row gutter={GUTTER} className="home-info-row">
      <Button
        onClick={() =>
          addCustomSingleSignerTransaction(
            connection,
            wallet,
            proposal,
            sigAccount.pubkey,
          )
        }
      >
        Add transaction to {proposal.pubkey.toBase58()}
      </Button>
    </Row>
  );
}
