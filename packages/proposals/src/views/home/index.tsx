import { Badge, Col, List, Row, Statistic } from 'antd';
import React, { useMemo, useState } from 'react';
import { useProposals } from '../../contexts/proposals';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
import { TokenIcon, useConnectionConfig, useWallet } from '@oyster/common';
import { Background } from './../../components/Background';
import { useHistory } from 'react-router-dom';
import { RegisterGovernanceMenuItem } from '../governance/register';
import { TimelockStateStatus } from '../../models/timelock';

export const HomeView = () => {
  const history = useHistory();
  const { configs, proposals } = useProposals();
  const { connected } = useWallet();
  const listData = useMemo(() => {
    const newListData: any[] = [];

    Object.keys(configs).forEach(configKey => {
      const config = configs[configKey];
      const mint = config.info.governanceMint.toBase58();

      const proposalCount = Object.keys(proposals).reduce((acc, proposalKey) => {
        let proposal = proposals[proposalKey];
        if(proposal.info.config.toBase58() == configKey) {
          acc.active = acc.active + (
            proposal.info.state.status === TimelockStateStatus.Voting ||
            proposal.info.state.status === TimelockStateStatus.Draft ? 1 : 0);

          acc.total = acc.total +1;
        }

        return acc;
      }, {
        active: 0,
        total: 0,
      });


      newListData.push({
        href: '/governance/' + configKey,
        title: config.info.name,
        badge: <Badge count={proposalCount.active}>
                  <TokenIcon mintAddress={mint} size={40} />
                </Badge>,
        proposalCount,
        configKey,
        config,
      });
    });
    return newListData;
  }, [configs, proposals]);


  return (
    <>
      <Background />
      <Row>
        <Col flex="auto" xxl={15} xs={24} className="governance-container">
          <div className="governance-title">
            <h1>Governance</h1>
            <RegisterGovernanceMenuItem style={{ marginLeft: 'auto', marginRight: 0 }} disabled={!connected} />
          </div>
          <List
            itemLayout="vertical"
            size="large"
            loading={listData.length === 0}
            pagination={false}
            dataSource={listData}

            renderItem={item => (
                <List.Item key={item.title} className="governance-item" onClick={() => history.push(item.href)}
                  extra={
                    <>
                      <Statistic title="Proposals" value={item.proposalCount.total} />
                    </>
                  }>
                  <List.Item.Meta
                    avatar={item.badge}
                    title={item.title}
                    description={item.description}
                  >
                  </List.Item.Meta>


                </List.Item>
            )}
          />
        </Col>
      </Row>
    </>
  );
};
