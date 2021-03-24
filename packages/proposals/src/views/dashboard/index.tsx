import { Button, Row, Spin } from 'antd';
import React from 'react';
import { GUTTER } from '../../constants';
import { contexts, hooks, ParsedAccount } from '@oyster/common';
import './style.less';
import { useProposals } from '../../contexts/proposals';
import { TimelockSet } from '../../models/timelock';
import { Connection } from '@solana/web3.js';
import { addCustomSingleSignerTransaction } from '../../actions/addCustomSingleSignerTransaction';
import { WalletAdapter } from '@solana/wallet-base';
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
      <Row gutter={GUTTER} className="home-info-row"></Row>
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
  wallet: WalletAdapter;
  proposal: ParsedAccount<TimelockSet>;
}) {
  const sigAccount = useAccountByMint(proposal.info.signatoryMint);
  if (!sigAccount) return <Spin />;
  return <Row gutter={GUTTER} className="home-info-row"></Row>;
}
