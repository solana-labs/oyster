import { Col, Row, Space } from 'antd';
import React, { useMemo } from 'react';
import { GUTTER } from '../../constants';
import { Button } from 'antd';
import { createProposal } from '../../actions/createProposal';
import { contexts, ParsedAccount } from '@oyster/common';
import { Proposal } from '../../components/Proposal';
import { ProposalsContext, useProposals } from '../../contexts/proposals';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
import { TimelockSet } from '../../models/timelock';
const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const ROW_SIZE = 3;

export const HomeView = () => {
  const wallet = useWallet();
  const connection = useConnection();
  const context = useProposals();

  const rows = useMemo(() => {
    const newRows: ParsedAccount<TimelockSet>[][] = [[]];
    Object.keys(context.proposals).forEach(key => {
      newRows[newRows.length - 1].push(context.proposals[key]);
      if (newRows[newRows.length - 1].length === ROW_SIZE) newRows.push([]);
    });
    return newRows;
  }, [context.proposals]);
  return (
    <div className="flexColumn">
      <Row gutter={GUTTER} className="home-info-row">
        <Button onClick={() => createProposal(connection, wallet.wallet)}>
          Click me
        </Button>
      </Row>
      <Space direction="vertical" size="large">
        {rows.map((row, i) => (
          <Row
            key={i}
            gutter={GUTTER}
            className="home-info-row"
            justify={'space-around'}
          >
            {row.map(proposal => (
              <Col key={proposal.pubkey.toBase58()} span={6}>
                <Proposal proposal={proposal} />
              </Col>
            ))}
          </Row>
        ))}
      </Space>
    </div>
  );
};
