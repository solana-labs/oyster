import { Row } from 'antd';
import React from 'react';
import { GUTTER } from '../../constants';
import { Button } from 'antd';
import { createProposal } from '../../actions/createProposal';
import { contexts } from '@oyster/common';
import { Proposal } from '../../components/Proposal';
import { ProposalsContext } from '../../contexts/proposals';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
export const HomeView = () => {
  const wallet = useWallet();
  const connection = useConnection();
  return (
    <div className="flexColumn">
      <Row gutter={GUTTER} className="home-info-row">
        <Button onClick={() => createProposal(connection, wallet.wallet)}>
          Click me
        </Button>
        <Proposal />
      </Row>
    </div>
  );
};
